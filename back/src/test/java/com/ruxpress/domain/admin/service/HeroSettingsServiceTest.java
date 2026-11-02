package com.ruxpress.domain.admin.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.util.ModulePrefix;
import com.ruxpress.domain.admin.dto.response.HeroSettingsResponse;
import com.ruxpress.domain.admin.entity.SystemSetting;
import com.ruxpress.domain.admin.repository.SystemSettingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HeroSettingsServiceTest {

    private static final String HERO_KEY = "hero_image";
    private static final String HERO_CATEGORY = "SITE";
    private static final String HERO_DESCRIPTION = "메인 히어로 이미지 저장 경로";
    private static final String OLD_STORED_PATH = "hero/25/10/29/old.jpg";
    private static final String NEW_STORED_PATH = "hero/25/10/30/new.jpg";
    private static final String VIEW_PREFIX = "/api/v1/local-files/";

    @Mock
    private SystemSettingRepository settingRepository;

    @Mock
    private FileStoragePort fileStoragePort;

    @InjectMocks
    private HeroSettingsService heroSettingsService;

    // ─── getHero ──────────────────────────────────────────

    @Test
    void getHero_returnsNullImageUrlWhenSettingMissing() {
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.empty());

        HeroSettingsResponse response = heroSettingsService.getHero();

        assertThat(response.getImageUrl()).isNull();
        verify(fileStoragePort, never()).getViewUrl(any());
    }

    @Test
    void getHero_returnsNullImageUrlWhenValueBlank() {
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.of(heroSetting("   ")));

        HeroSettingsResponse response = heroSettingsService.getHero();

        assertThat(response.getImageUrl()).isNull();
        verify(fileStoragePort, never()).getViewUrl(any());
    }

    @Test
    void getHero_resolvesViewUrlFromStoredPath() {
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.of(heroSetting(OLD_STORED_PATH)));
        when(fileStoragePort.getViewUrl(OLD_STORED_PATH)).thenReturn(VIEW_PREFIX + OLD_STORED_PATH);

        HeroSettingsResponse response = heroSettingsService.getHero();

        assertThat(response.getImageUrl()).isEqualTo(VIEW_PREFIX + OLD_STORED_PATH);
    }

    // ─── upload ───────────────────────────────────────────

    @Test
    void upload_storesUpdatesSettingDeletesPreviousFileAndReturnsViewUrl() {
        SystemSetting setting = heroSetting(OLD_STORED_PATH);
        MockMultipartFile file = new MockMultipartFile("file", "hero.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(fileStoragePort.store(ModulePrefix.HERO, file)).thenReturn(NEW_STORED_PATH);
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.of(setting));
        when(settingRepository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fileStoragePort.getViewUrl(NEW_STORED_PATH)).thenReturn(VIEW_PREFIX + NEW_STORED_PATH);

        HeroSettingsResponse response = heroSettingsService.upload(42L, file);

        assertThat(response.getImageUrl()).isEqualTo(VIEW_PREFIX + NEW_STORED_PATH);
        assertThat(setting.getSettingValue()).isEqualTo(NEW_STORED_PATH);
        assertThat(setting.getUpdatedBy()).isEqualTo(42L);
        assertThat(setting.getCategory()).isEqualTo(HERO_CATEGORY);
        assertThat(setting.getSettingKey()).isEqualTo(HERO_KEY);
        verify(fileStoragePort).store(ModulePrefix.HERO, file);
        verify(settingRepository).save(setting);
        verify(fileStoragePort).delete(OLD_STORED_PATH);
    }

    @Test
    void upload_createsSettingRowWhenMissing() {
        MockMultipartFile file = new MockMultipartFile("file", "hero.png", "image/png", new byte[]{1});
        when(fileStoragePort.store(ModulePrefix.HERO, file)).thenReturn(NEW_STORED_PATH);
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.empty());
        when(settingRepository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fileStoragePort.getViewUrl(NEW_STORED_PATH)).thenReturn(VIEW_PREFIX + NEW_STORED_PATH);

        HeroSettingsResponse response = heroSettingsService.upload(7L, file);

        ArgumentCaptor<SystemSetting> captor = ArgumentCaptor.forClass(SystemSetting.class);
        verify(settingRepository).save(captor.capture());
        SystemSetting saved = captor.getValue();
        assertThat(saved.getCategory()).isEqualTo(HERO_CATEGORY);
        assertThat(saved.getSettingKey()).isEqualTo(HERO_KEY);
        assertThat(saved.getSettingValue()).isEqualTo(NEW_STORED_PATH);
        assertThat(saved.getDescription()).isEqualTo(HERO_DESCRIPTION);
        assertThat(saved.getUpdatedBy()).isEqualTo(7L);
        assertThat(response.getImageUrl()).isEqualTo(VIEW_PREFIX + NEW_STORED_PATH);
        verify(fileStoragePort, never()).delete(any());
    }

    @Test
    void upload_withBlankPreviousValueDoesNotDeleteAnything() {
        MockMultipartFile file = new MockMultipartFile("file", "hero.webp", "image/webp", new byte[]{1});
        when(fileStoragePort.store(ModulePrefix.HERO, file)).thenReturn(NEW_STORED_PATH);
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.of(heroSetting("")));
        when(settingRepository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fileStoragePort.getViewUrl(NEW_STORED_PATH)).thenReturn(VIEW_PREFIX + NEW_STORED_PATH);

        heroSettingsService.upload(1L, file);

        verify(fileStoragePort, never()).delete(any());
    }

    @Test
    void upload_ignoresFailureWhileDeletingPreviousFile() {
        SystemSetting setting = heroSetting(OLD_STORED_PATH);
        MockMultipartFile file = new MockMultipartFile("file", "hero.jpg", "image/jpeg", new byte[]{1});
        when(fileStoragePort.store(ModulePrefix.HERO, file)).thenReturn(NEW_STORED_PATH);
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.of(setting));
        when(settingRepository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fileStoragePort.getViewUrl(NEW_STORED_PATH)).thenReturn(VIEW_PREFIX + NEW_STORED_PATH);
        doThrow(new RuntimeException("storage down")).when(fileStoragePort).delete(OLD_STORED_PATH);

        HeroSettingsResponse response = heroSettingsService.upload(1L, file);

        assertThat(response.getImageUrl()).isEqualTo(VIEW_PREFIX + NEW_STORED_PATH);
        assertThat(setting.getSettingValue()).isEqualTo(NEW_STORED_PATH);
    }

    @Test
    void upload_rejectsNonImageContentType() {
        MockMultipartFile file = new MockMultipartFile("file", "notes.txt", "text/plain", new byte[]{1});

        assertThatThrownBy(() -> heroSettingsService.upload(1L, file))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

        verify(fileStoragePort, never()).store(any(), any());
        verify(settingRepository, never()).save(any());
    }

    @Test
    void upload_rejectsNullFile() {
        assertThatThrownBy(() -> heroSettingsService.upload(1L, null))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);

        verify(fileStoragePort, never()).store(any(), any());
        verify(settingRepository, never()).save(any());
    }

    @Test
    void upload_wrapsStorageFailure() {
        MockMultipartFile file = new MockMultipartFile("file", "hero.jpg", "image/jpeg", new byte[]{1});
        when(fileStoragePort.store(ModulePrefix.HERO, file)).thenThrow(new RuntimeException("disk full"));

        assertThatThrownBy(() -> heroSettingsService.upload(1L, file))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_UPLOAD_FAILED);

        verify(settingRepository, never()).save(any());
        verify(fileStoragePort, never()).delete(any());
    }

    @Test
    void upload_passesThroughBusinessExceptionFromStorage() {
        MockMultipartFile file = new MockMultipartFile("file", "hero.jpg", "image/jpeg", new byte[]{1});
        when(fileStoragePort.store(ModulePrefix.HERO, file))
                .thenThrow(new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED));

        assertThatThrownBy(() -> heroSettingsService.upload(1L, file))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_SIZE_EXCEEDED);

        verify(settingRepository, never()).save(any());
    }

    // ─── remove ───────────────────────────────────────────

    @Test
    void remove_clearsValueKeepsRowAndDeletesFile() {
        SystemSetting setting = heroSetting(OLD_STORED_PATH);
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.of(setting));
        when(settingRepository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        HeroSettingsResponse response = heroSettingsService.remove(9L);

        assertThat(response.getImageUrl()).isNull();
        assertThat(setting.getSettingValue()).isEmpty();
        assertThat(setting.getSettingKey()).isEqualTo(HERO_KEY);
        assertThat(setting.getUpdatedBy()).isEqualTo(9L);
        verify(settingRepository).save(setting);
        verify(settingRepository, never()).delete(any(SystemSetting.class));
        verify(settingRepository, never()).deleteById(any());
        verify(fileStoragePort).delete(OLD_STORED_PATH);
        verify(fileStoragePort, never()).getViewUrl(any());
    }

    @Test
    void remove_ignoresFailureWhileDeletingFile() {
        SystemSetting setting = heroSetting(OLD_STORED_PATH);
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.of(setting));
        when(settingRepository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("storage down")).when(fileStoragePort).delete(OLD_STORED_PATH);

        HeroSettingsResponse response = heroSettingsService.remove(9L);

        assertThat(response.getImageUrl()).isNull();
        assertThat(setting.getSettingValue()).isEmpty();
    }

    @Test
    void remove_whenNoSettingIsNoOp() {
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.empty());

        HeroSettingsResponse response = heroSettingsService.remove(9L);

        assertThat(response.getImageUrl()).isNull();
        verify(settingRepository, never()).save(any());
        verify(fileStoragePort, never()).delete(any());
    }

    @Test
    void remove_whenValueAlreadyBlankIsNoOp() {
        when(settingRepository.findBySettingKey(HERO_KEY)).thenReturn(Optional.of(heroSetting("")));

        HeroSettingsResponse response = heroSettingsService.remove(9L);

        assertThat(response.getImageUrl()).isNull();
        verify(settingRepository, never()).save(any());
        verify(fileStoragePort, never()).delete(any());
    }

    private static SystemSetting heroSetting(String value) {
        return SystemSetting.create(HERO_CATEGORY, HERO_KEY, value, HERO_DESCRIPTION, 1L);
    }
}
