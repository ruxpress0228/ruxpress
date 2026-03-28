package com.ruxpress.domain.banktransfer.dto.response;

import com.ruxpress.domain.banktransfer.entity.SettlementAccount;
import com.ruxpress.domain.banktransfer.util.BankAccountMasker;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SettlementAccountResponse {

    private final Long id;
    private final String bankName;
    private final String accountNumber;
    private final String accountHolder;
    private final String displayMemo;
    private final boolean active;

    public static SettlementAccountResponse from(SettlementAccount entity, boolean maskAccountNumber) {
        return new SettlementAccountResponse(
                entity.getId(),
                entity.getBankName(),
                maskAccountNumber ? BankAccountMasker.maskAccountNumber(entity.getAccountNumber()) : entity.getAccountNumber(),
                entity.getAccountHolder(),
                entity.getDisplayMemo(),
                entity.isActive());
    }
}
