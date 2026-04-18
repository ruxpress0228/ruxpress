package com.ruxpress.domain.user.repository;

import com.ruxpress.domain.user.entity.SocialProvider;
import com.ruxpress.domain.user.entity.UserSocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserSocialAccountRepository extends JpaRepository<UserSocialAccount, Long> {

    Optional<UserSocialAccount> findByProviderAndProviderUserId(SocialProvider provider, String providerUserId);

    Optional<UserSocialAccount> findByUserId(Long userId);
}
