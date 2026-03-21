package com.ruxpress.domain.admin.dto.request;

import com.ruxpress.domain.admin.entity.AdminStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatusChangeRequest {

    @NotNull(message = "상태를 선택해주세요")
    private AdminStatus status;
}
