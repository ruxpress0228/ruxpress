package com.ruxpress.domain.admin.dto.response;

import com.ruxpress.domain.admin.entity.AdminRole;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminLoginResponse {

    private final String token;
    private final Long adminId;
    private final String email;
    private final String name;
    private final AdminRole role;
}
