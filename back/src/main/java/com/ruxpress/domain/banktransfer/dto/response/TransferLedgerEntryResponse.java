package com.ruxpress.domain.banktransfer.dto.response;

import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntry;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class TransferLedgerEntryResponse {

    private final Long id;
    private final Long userId;
    /** 회원 조회 결과; 탈퇴·무결성 이슈 시 null */
    private final String userEmail;
    private final Long settlementAccountId;
    private final TransferLedgerEntryType entryType;
    private final TransferLedgerStatus status;
    private final BigDecimal amount;
    private final String currency;
    private final String depositorName;
    private final String depositorMemo;
    private final String adminMemo;
    private final String refType;
    private final Long refId;
    private final Long parentEntryId;
    private final LocalDateTime confirmedAt;
    private final Long confirmedByAdminId;
    private final LocalDateTime createdAt;
    private final SettlementAccountResponse settlementAccount;
    private final List<AttachmentResponse> attachments;

    public static TransferLedgerEntryResponse of(
            TransferLedgerEntry e,
            SettlementAccountResponse settlementAccount,
            String userEmail,
            List<AttachmentResponse> attachments) {
        return new TransferLedgerEntryResponse(
                e.getId(),
                e.getUserId(),
                userEmail,
                e.getSettlementAccountId(),
                e.getEntryType(),
                e.getStatus(),
                e.getAmount(),
                e.getCurrency(),
                e.getDepositorName(),
                e.getDepositorMemo(),
                e.getAdminMemo(),
                e.getRefType(),
                e.getRefId(),
                e.getParentEntryId(),
                e.getConfirmedAt(),
                e.getConfirmedByAdminId(),
                e.getCreatedAt(),
                settlementAccount,
                attachments);
    }
}
