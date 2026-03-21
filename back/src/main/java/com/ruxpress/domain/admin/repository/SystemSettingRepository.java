package com.ruxpress.domain.admin.repository;

import com.ruxpress.domain.admin.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {

    Optional<SystemSetting> findBySettingKey(String settingKey);

    List<SystemSetting> findByCategory(String category);

    List<SystemSetting> findByCategoryOrderBySettingKeyAsc(String category);
}
