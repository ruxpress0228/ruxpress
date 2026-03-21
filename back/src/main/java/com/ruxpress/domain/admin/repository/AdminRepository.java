package com.ruxpress.domain.admin.repository;

import com.ruxpress.domain.admin.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByEmailAndDeletedAtIsNull(String email);

    List<Admin> findByDeletedAtIsNullOrderByCreatedAtDesc();

    boolean existsByEmailAndDeletedAtIsNull(String email);
}
