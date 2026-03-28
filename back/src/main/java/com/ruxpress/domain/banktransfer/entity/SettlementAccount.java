package com.ruxpress.domain.banktransfer.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "settlement_accounts")
public class SettlementAccount extends BaseEntity {

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    @Column(name = "account_holder", nullable = false, length = 100)
    private String accountHolder;

    @Column(name = "display_memo", length = 300)
    private String displayMemo;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_by_admin_id")
    private Long createdByAdminId;

    public static SettlementAccount create(
            String bankName,
            String accountNumber,
            String accountHolder,
            String displayMemo,
            Long createdByAdminId) {
        SettlementAccount a = new SettlementAccount();
        a.bankName = bankName;
        a.accountNumber = accountNumber;
        a.accountHolder = accountHolder;
        a.displayMemo = displayMemo;
        a.active = true;
        a.createdByAdminId = createdByAdminId;
        return a;
    }

    public void update(String bankName, String accountNumber, String accountHolder, String displayMemo, Boolean active) {
        if (bankName != null) {
            this.bankName = bankName;
        }
        if (accountNumber != null) {
            this.accountNumber = accountNumber;
        }
        if (accountHolder != null) {
            this.accountHolder = accountHolder;
        }
        if (displayMemo != null) {
            this.displayMemo = displayMemo;
        }
        if (active != null) {
            this.active = active;
        }
    }
}
