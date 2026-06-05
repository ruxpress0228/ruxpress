package com.ruxpress.domain.user.dto.response;

import com.ruxpress.domain.user.entity.UserAddress;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class UserAddressResponse {

    private final Long id;
    private final String label;
    private final String recipientName;
    private final String recipientPhone;
    private final String postalCode;
    private final String addressLine1;
    private final String addressLine2;
    private final boolean isDefault;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static UserAddressResponse from(UserAddress a) {
        return new UserAddressResponse(
                a.getId(),
                a.getLabel(),
                a.getRecipientName(),
                a.getRecipientPhone(),
                a.getPostalCode(),
                a.getAddressLine1(),
                a.getAddressLine2(),
                a.isDefault(),
                a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
