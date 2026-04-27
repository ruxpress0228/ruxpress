package com.ruxpress.common.storage;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class FileStorageUtil {

    private static final DateTimeFormatter DATE_PREFIX_FORMATTER = DateTimeFormatter.ofPattern("yy/MM/dd");

    private FileStorageUtil() {
    }

    public static final int MAX_IMAGE_COUNT = 10;
    public static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB
    public static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp");
    public static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    public static String datePrefix() {
        return LocalDate.now(ZoneId.systemDefault()).format(DATE_PREFIX_FORMATTER);
    }

    public static String buildDatedPath(String directory, String filename) {
        return join(directory, datePrefix(), filename);
    }

    public static String buildDatedDirectory(String directory) {
        return join(directory, datePrefix());
    }

    public static void validateImageOrThrow(MultipartFile file) {
        if (file == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && !originalFilename.isBlank()) {
            String ext = getExtensionLower(originalFilename);
            if (ext != null && !ALLOWED_EXT.contains(ext)) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
        }
    }

    private static String getExtensionLower(String filename) {
        int dotIdx = filename.lastIndexOf('.');
        if (dotIdx < 0 || dotIdx == filename.length() - 1) {
            return null;
        }
        return filename.substring(dotIdx + 1).toLowerCase(Locale.ROOT);
    }

    private static String join(String... parts) {
        List<String> normalized = new ArrayList<>();
        for (String part : parts) {
            String s = normalizeSegment(part);
            if (!s.isBlank()) {
                normalized.add(s);
            }
        }
        return String.join("/", normalized);
    }

    private static String normalizeSegment(String raw) {
        if (raw == null) return "";
        String s = raw.trim().replace('\\', '/');
        while (s.startsWith("/")) s = s.substring(1);
        while (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        return s;
    }
}

