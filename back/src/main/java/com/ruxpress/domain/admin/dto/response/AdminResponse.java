package com.ruxpress.domain.admin.dto.response;

import com.ruxpress.domain.admin.entity.Admin;
import com.ruxpress.domain.admin.entity.AdminRole;
import com.ruxpress.domain.admin.entity.AdminStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AdminResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final String phone;
    private final AdminRole role;
    private final AdminStatus status;
    private final LocalDateTime lastLoginAt;
    private final LocalDateTime createdAt;

    public static AdminResponse from(Admin admin) {
        return new AdminResponse(
                admin.getId(),
                admin.getEmail(),
                admin.getName(),
                admin.getPhone(),
                admin.getRole(),
                admin.getStatus(),
                admin.getLastLoginAt(),
                admin.getCreatedAt()
        );
    }
}
