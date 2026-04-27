package com.ruxpress.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.net.URL;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import com.ruxpress.common.util.ModulePrefix;

/**
 * S3 파일 저장 어댑터 (prod).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3FileStorageAdapter implements FileStoragePort {

    @Value("${storage.s3.bucket:}")
    private String bucket;

    @Value("${storage.s3.region:ap-northeast-2}")
    private String region;

    @Value("${storage.s3.access-key:}")
    private String accessKey;

    @Value("${storage.s3.secret-key:}")
    private String secretKey;

    @Value("${storage.s3.presign-expiration-seconds:600}")
    private long presignExpirationSeconds;

    private volatile S3Client s3Client;
    private volatile S3Presigner s3Presigner;

    @Override
    public String store(String directory, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (ModulePrefix.PURCHASE.equals(directory)) {
            FileStorageUtil.validateImageOrThrow(file);
        }
        String resolvedBucket = normalizeBucket(bucket);
        if (resolvedBucket.isBlank()) {
            throw new IllegalStateException("storage.s3.bucket is required when storage.type=s3");
        }
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .orElse("");
        String storedFilename = UUID.randomUUID() + ext;
        String key = FileStorageUtil.buildDatedPath(directory, storedFilename);

        try {
            PutObjectRequest.Builder req = PutObjectRequest.builder()
                    .bucket(resolvedBucket)
                    .key(key);
            String contentType = file.getContentType();
            if (contentType != null && !contentType.isBlank()) {
                req = req.contentType(contentType);
            }

            log.info("S3 upload start. bucket={}, key={}, sizeBytes={}, contentType={}",
                    resolvedBucket, key, file.getSize(), contentType);
            getS3Client().putObject(
                    req.build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
            log.info("S3 upload done. bucket={}, key={}", resolvedBucket, key);
        } catch (Exception e) {
            log.error("S3 upload failed. bucket={}, key={}", resolvedBucket, key, e);
            throw new RuntimeException("Failed to upload to S3", e);
        }

        // DB에는 key를 포함한 S3 위치를 저장 (버킷명 포함).
        return "s3://" + resolvedBucket + "/" + key;
    }

    @Override
    public Resource loadAsResource(String storedUrl) {
        if (storedUrl == null || storedUrl.isBlank()) {
            throw new IllegalArgumentException("storedUrl must not be blank");
        }
        try {
            S3Location loc = parseStoredUrl(storedUrl);
            log.info("S3 presign download start. bucket={}, key={}, expiresSec={}",
                    loc.bucket(), loc.key(), presignExpirationSeconds);
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(loc.bucket())
                    .key(loc.key())
                    .build();
            PresignedGetObjectRequest presigned = getS3Presigner().presignGetObject(
                    GetObjectPresignRequest.builder()
                            .signatureDuration(Duration.ofSeconds(Math.max(60, presignExpirationSeconds)))
                            .getObjectRequest(getObjectRequest)
                            .build()
            );
            URL url = java.util.Objects.requireNonNull(presigned.url(), "presigned url");
            log.info("S3 presign download done. bucket={}, key={}", loc.bucket(), loc.key());
            return new UrlResource(url);
        } catch (Exception e) {
            log.error("S3 presign download failed. storedUrl={}", storedUrl, e);
            throw new RuntimeException("Failed to create download resource for: " + storedUrl, e);
        }
    }

    @Override
    public void delete(String storedUrl) {
        if (storedUrl == null || storedUrl.isBlank()) {
            return;
        }
        try {
            S3Location loc = parseStoredUrl(storedUrl);
            log.info("S3 delete start. bucket={}, key={}", loc.bucket(), loc.key());
            getS3Client().deleteObject(DeleteObjectRequest.builder()
                    .bucket(loc.bucket())
                    .key(loc.key())
                    .build());
            log.info("S3 delete done. bucket={}, key={}", loc.bucket(), loc.key());
        } catch (Exception e) {
            log.warn("Failed to delete S3 object: {}", storedUrl, e);
        }
    }

    private S3Client getS3Client() {
        S3Client local = s3Client;
        if (local != null) return local;
        synchronized (this) {
            if (s3Client == null) {
                s3Client = S3Client.builder()
                        .region(Region.of(region))
                        .credentialsProvider(resolveCredentialsProvider())
                        .build();
            }
            return s3Client;
        }
    }

    private S3Presigner getS3Presigner() {
        S3Presigner local = s3Presigner;
        if (local != null) return local;
        synchronized (this) {
            if (s3Presigner == null) {
                s3Presigner = S3Presigner.builder()
                        .region(Region.of(region))
                        .credentialsProvider(resolveCredentialsProvider())
                        .build();
            }
            return s3Presigner;
        }
    }

    private AwsCredentialsProvider resolveCredentialsProvider() {
        String ak = accessKey != null ? accessKey.trim() : "";
        String sk = secretKey != null ? secretKey.trim() : "";
        if (!ak.isBlank() && !sk.isBlank()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(ak, sk));
        }
        return DefaultCredentialsProvider.create();
    }

    private String normalizeBucket(String raw) {
        if (raw == null) return "";
        String b = raw.trim();
        if (b.startsWith("s3://")) {
            b = b.substring("s3://".length());
        }
        while (b.endsWith("/")) {
            b = b.substring(0, b.length() - 1);
        }
        return b;
    }

    private S3Location parseStoredUrl(String storedUrl) {
        String s = storedUrl.trim();
        if (s.startsWith("s3://")) {
            s = s.substring("s3://".length());
        }
        int slash = s.indexOf('/');
        if (slash <= 0 || slash == s.length() - 1) {
            throw new IllegalArgumentException("Invalid S3 storedUrl: " + storedUrl);
        }
        String b = normalizeBucket(s.substring(0, slash));
        String key = s.substring(slash + 1);
        if (b.isBlank() || key.isBlank()) {
            throw new IllegalArgumentException("Invalid S3 storedUrl: " + storedUrl);
        }
        return new S3Location(b, key);
    }

    private record S3Location(String bucket, String key) {
    }
}
