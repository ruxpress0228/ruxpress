package com.ruxpress.domain.user.dto.request;

import com.ruxpress.domain.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusChangeRequest {

    @NotNull(message = "상태를 선택해주세요")
    private UserStatus status;
}
