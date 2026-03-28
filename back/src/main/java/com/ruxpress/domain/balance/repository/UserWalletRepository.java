package com.ruxpress.domain.balance.repository;

import com.ruxpress.domain.balance.entity.UserWallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserWalletRepository extends JpaRepository<UserWallet, Long> {

    Optional<UserWallet> findByUserId(Long userId);

    List<UserWallet> findByUserIdIn(Collection<Long> userIds);
}
