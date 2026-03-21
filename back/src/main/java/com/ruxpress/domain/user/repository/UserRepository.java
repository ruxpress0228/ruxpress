package com.ruxpress.domain.user.repository;

import com.ruxpress.domain.user.entity.User;

import com.ruxpress.domain.user.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.time.LocalDateTime;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    Page<User> findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(UserStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL " +
           "AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "  OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY u.createdAt DESC")
    Page<User> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL " +
           "AND u.status = :status " +
           "AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "  OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY u.createdAt DESC")
    Page<User> searchByKeywordAndStatus(@Param("keyword") String keyword, @Param("status") UserStatus status, Pageable pageable);

    long countByDeletedAtIsNull();

    long countByStatusAndDeletedAtIsNull(UserStatus status);

    long countByCreatedAtAfterAndDeletedAtIsNull(LocalDateTime after);
}
