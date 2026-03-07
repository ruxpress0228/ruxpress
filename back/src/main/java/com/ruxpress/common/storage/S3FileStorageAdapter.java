package com.ruxpress.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Optional;
import java.util.UUID;

/**
 * S3 파일 저장 어댑터 (prod).
 * AWS SDK 의존성 추가 후 실제 업로드/다운로드 구현 예정. 현재는 stub.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3FileStorageAdapter implements FileStoragePort {

    @Value("${storage.s3.bucket:}")
    private String bucket;

    @Value("${storage.s3.region:ap-northeast-2}")
    private String region;

    @Override
    public String store(String directory, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .orElse("");
        String key = directory + "/" + UUID.randomUUID() + ext;
        // TODO: AWS S3 SDK로 실제 업로드 후 public URL 또는 presigned URL 반환
        // 예: return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
        log.warn("S3FileStorageAdapter is stub. Key would be: {}", key);
        return "s3://" + bucket + "/" + key;
    }

    @Override
    public Resource loadAsResource(String storedUrl) {
        try {
            return new UrlResource(new URL(storedUrl));
        } catch (MalformedURLException e) {
            throw new RuntimeException("Invalid stored URL: " + storedUrl, e);
        }
    }

    @Override
    public void delete(String storedUrl) {
        // TODO: S3 객체 삭제
        log.warn("S3FileStorageAdapter delete stub: {}", storedUrl);
    }
}
