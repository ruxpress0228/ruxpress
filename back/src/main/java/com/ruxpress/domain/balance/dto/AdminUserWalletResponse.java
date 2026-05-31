package com.ruxpress.domain.balance.dto;

import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class AdminUserWalletResponse {

    private final Long userId;
    private final String email;
    private final String nickname;
    private final UserStatus status;
    private final BigDecimal balance;

    public static AdminUserWalletResponse of(User user, BigDecimal balance) {
        return new AdminUserWalletResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getStatus(),
                balance != null ? balance : BigDecimal.ZERO);
    }
}
