package com.ruxpress.domain.balance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class AdminWalletAdjustResponse {

    private final Long userId;
    private final BigDecimal balanceAfter;
    private final WalletLedgerEntryResponse ledgerEntry;
}
