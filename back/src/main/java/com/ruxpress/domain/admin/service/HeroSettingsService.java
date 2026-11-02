package com.ruxpress.domain.admin.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.storage.FileStorageUtil;
import com.ruxpress.common.util.ModulePrefix;
import com.ruxpress.domain.admin.dto.response.HeroSettingsResponse;
import com.ruxpress.domain.admin.entity.SystemSetting;
import com.ruxpress.domain.admin.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 스토어프론트 랜딩 히어로 이미지.
 * 파일은 {@link FileStoragePort} 에 {@code hero/...} 접두 경로로 저장하고, 저장 경로는 system_settings 의
 * {@code hero_image} 행(카테고리 SITE)에 보관한다. 응답의 imageUrl 은 저장 경로를 getViewUrl 로 바꾼 값이다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HeroSettingsService {

    static final String HERO_IMAGE_KEY = "hero_image";
    static final String HERO_CATEGORY = "SITE";
    static final String HERO_DESCRIPTION = "메인 히어로 이미지 저장 경로";

    private final SystemSettingRepository settingRepository;
    private final FileStoragePort fileStoragePort;

    /** 공개 조회. 설정 행이 없거나 값이 비어 있으면 imageUrl 은 null. */
    @Transactional(readOnly = true)
    public HeroSettingsResponse getHero() {
        String storedPath = settingRepository.findBySettingKey(HERO_IMAGE_KEY)
                .map(SystemSetting::getSettingValue)
                .orElse(null);
        return toResponse(storedPath);
    }

    /**
     * 히어로 이미지 업로드(교체). 검증 → 저장 → 설정 행 생성/갱신 → 이전 파일 best-effort 삭제(저장소 오류는 무시).
     * 저장소 오류는 {@link ErrorCode#FILE_UPLOAD_FAILED} 로 감싼다.
     */
    @Transactional
    public HeroSettingsResponse upload(Long adminId, MultipartFile file) {
        FileStorageUtil.validateImageOrThrow(file);

        String storedPath;
        try {
            storedPath = fileStoragePort.store(ModulePrefix.HERO, file);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Hero image upload failed. adminId={}", adminId, e);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
        }

        SystemSetting setting = settingRepository.findBySettingKey(HERO_IMAGE_KEY).orElse(null);
        String previousStoredPath = setting != null ? setting.getSettingValue() : null;
        if (setting == null) {
            setting = SystemSetting.create(HERO_CATEGORY, HERO_IMAGE_KEY, storedPath, HERO_DESCRIPTION, adminId);
        } else {
            setting.updateValue(storedPath, adminId);
        }
        settingRepository.save(setting);

        if (hasText(previousStoredPath) && !previousStoredPath.equals(storedPath)) {
            deleteStoredFileQuietly(previousStoredPath);
        }
        return toResponse(storedPath);
    }

    /**
     * 히어로 이미지 해제. setting_value 는 NOT NULL 이므로 행은 남기고 값만 빈 문자열로 비운 뒤 파일을 best-effort 삭제한다.
     * 설정 행이 없거나 이미 비어 있으면 아무것도 하지 않는다(멱등).
     */
    @Transactional
    public HeroSettingsResponse remove(Long adminId) {
        SystemSetting setting = settingRepository.findBySettingKey(HERO_IMAGE_KEY).orElse(null);
        if (setting == null || !hasText(setting.getSettingValue())) {
            return toResponse(null);
        }
        String previousStoredPath = setting.getSettingValue();
        setting.updateValue("", adminId);
        settingRepository.save(setting);
        deleteStoredFileQuietly(previousStoredPath);
        return toResponse(null);
    }

    // ─── Helpers ──────────────────────────────────────────

    private HeroSettingsResponse toResponse(String storedPath) {
        String imageUrl = hasText(storedPath) ? fileStoragePort.getViewUrl(storedPath) : null;
        return new HeroSettingsResponse(imageUrl);
    }

    private void deleteStoredFileQuietly(String storedPath) {
        if (!hasText(storedPath)) {
            return;
        }
        try {
            fileStoragePort.delete(storedPath);
        } catch (Exception e) {
            log.warn("Failed to delete hero image file: {}", storedPath, e);
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
