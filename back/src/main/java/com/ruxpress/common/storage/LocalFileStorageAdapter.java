package com.ruxpress.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.ruxpress.common.util.ModulePrefix;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
@SuppressWarnings("null")
public class LocalFileStorageAdapter implements FileStoragePort {

    private final Path rootLocation;

    public LocalFileStorageAdapter(
            @Value("${storage.local.upload-dir:./uploads}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory", e);
        }
    }

    @Override
    public String store(String directory, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (ModulePrefix.PURCHASE.equals(directory)) {
            FileStorageUtil.validateImageOrThrow(file);
        }
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .orElse("");
        String storedFilename = UUID.randomUUID() + ext;
        String storedDir = FileStorageUtil.buildDatedDirectory(directory);
        Path targetDir = rootLocation.resolve(Paths.get(storedDir));
        try {
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(storedFilename);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, targetFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Failed to store file: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("Failed to store file", e);
        }
        return storedDir + "/" + storedFilename;
    }

    @Override
    public Resource loadAsResource(String storedUrl) {
        try {
            Path file = rootLocation.resolve(storedUrl).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("File not found or not readable: " + storedUrl);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read file: " + storedUrl, e);
        }
    }

    @Override
    public String getViewUrl(String storedUrl) {
        return null;
    }

    @Override
    public void delete(String storedUrl) {
        try {
            Path file = rootLocation.resolve(storedUrl).normalize();
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", storedUrl, e);
        }
    }
}
