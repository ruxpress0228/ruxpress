package com.ruxpress.domain.user.repository;

import com.ruxpress.domain.user.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    List<UserAddress> findByUserIdOrderByIsDefaultDescCreatedAtAsc(Long userId);

    Optional<UserAddress> findByIdAndUserId(Long id, Long userId);

    List<UserAddress> findByUserIdAndIsDefaultTrue(Long userId);

    long countByUserId(Long userId);
}
