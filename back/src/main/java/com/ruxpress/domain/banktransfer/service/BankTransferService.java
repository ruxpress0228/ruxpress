package com.ruxpress.domain.banktransfer.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.banktransfer.dto.request.AdminMemoRequest;
import com.ruxpress.domain.banktransfer.dto.request.DepositReportRequest;
import com.ruxpress.domain.banktransfer.dto.request.SettlementOrRefundRequest;
import com.ruxpress.domain.banktransfer.dto.response.LedgerReceiptResponse;
import com.ruxpress.domain.banktransfer.dto.response.SettlementAccountResponse;
import com.ruxpress.domain.banktransfer.dto.response.TransferLedgerEntryResponse;
import com.ruxpress.domain.banktransfer.entity.SettlementAccount;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntry;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus;
import com.ruxpress.domain.banktransfer.repository.SettlementAccountRepository;
import com.ruxpress.domain.banktransfer.repository.TransferLedgerEntryRepository;
import com.ruxpress.domain.banktransfer.repository.TransferLedgerSpecifications;
import com.ruxpress.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BankTransferService {

    private final TransferLedgerEntryRepository entryRepository;
    private final SettlementAccountRepository settlementAccountRepository;
    private final NotificationService notificationService;

    public List<SettlementAccountResponse> listActiveSettlementAccountsForUser() {
        return settlementAccountRepository.findByActiveTrueAndDeletedAtIsNullOrderByIdAsc().stream()
                .map(a -> SettlementAccountResponse.from(a, true))
                .toList();
    }

    @Transactional
    public TransferLedgerEntryResponse createDepositReport(Long userId, DepositReportRequest request) {
        if (request.getEntryType() != TransferLedgerEntryType.DEPOSIT
                && request.getEntryType() != TransferLedgerEntryType.ESCROW_HOLD) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        String idemKey = request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()
                ? request.getIdempotencyKey().trim()
                : null;
        request.setIdempotencyKey(idemKey);
        if (idemKey != null) {
            var existing = entryRepository.findByIdempotencyKey(idemKey);
            if (existing.isPresent()) {
                TransferLedgerEntry e = existing.get();
                if (!e.getUserId().equals(userId)) {
                    throw new BusinessException(ErrorCode.DUPLICATE_IDEMPOTENCY_KEY);
                }
                return toResponse(e, true);
            }
        }

        SettlementAccount account = settlementAccountRepository.findById(request.getSettlementAccountId())
                .filter(a -> a.getDeletedAt() == null && a.isActive())
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLEMENT_ACCOUNT_NOT_FOUND));

        TransferLedgerEntry entry = TransferLedgerEntry.createRootEntry(
                userId,
                account.getId(),
                request.getEntryType(),
                request.getAmount(),
                request.getCurrency(),
                request.getDepositorName(),
                request.getDepositorMemo(),
                request.getRefType(),
                request.getRefId(),
                request.getIdempotencyKey());
        TransferLedgerEntry saved = entryRepository.save(entry);
        return toResponse(saved, true);
    }

    public PageResponse<TransferLedgerEntryResponse> listMyEntries(Long userId, PageRequest pageRequest) {
        Page<TransferLedgerEntry> page = entryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest);
        return new PageResponse<>(
                page.getContent().stream().map(e -> toResponse(e, true)).toList(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize());
    }

    public TransferLedgerEntryResponse getMyEntry(Long userId, Long entryId) {
        TransferLedgerEntry entry = entryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        return toResponse(entry, true);
    }

    public LedgerReceiptResponse getMyReceipt(Long userId, Long entryId) {
        TransferLedgerEntry entry = entryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        if (entry.getStatus() != TransferLedgerStatus.CONFIRMED) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        SettlementAccount account = settlementAccountRepository.findById(entry.getSettlementAccountId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLEMENT_ACCOUNT_NOT_FOUND));
        return new LedgerReceiptResponse(
                entry.getId(),
                entry.getEntryType().name(),
                entry.getStatus().name(),
                entry.getAmount(),
                entry.getCurrency(),
                entry.getConfirmedAt(),
                entry.getCreatedAt(),
                SettlementAccountResponse.from(account, true),
                entry.getDepositorName());
    }

    public PageResponse<TransferLedgerEntryResponse> listForAdmin(
            TransferLedgerStatus status,
            TransferLedgerEntryType entryType,
            Long filterUserId,
            PageRequest pageRequest) {
        Specification<TransferLedgerEntry> spec = Specification.allOf(
                TransferLedgerSpecifications.statusEquals(status),
                TransferLedgerSpecifications.entryTypeEquals(entryType),
                TransferLedgerSpecifications.userIdEquals(filterUserId));
        Page<TransferLedgerEntry> page = entryRepository.findAll(spec, pageRequest);
        return new PageResponse<>(
                page.getContent().stream().map(e -> toResponse(e, false)).toList(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize());
    }

    public TransferLedgerEntryResponse getForAdmin(Long entryId) {
        TransferLedgerEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        return toResponse(entry, false);
    }

    @Transactional
    public TransferLedgerEntryResponse confirmDeposit(Long adminId, Long entryId, AdminMemoRequest request) {
        TransferLedgerEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        if (!entry.isRootDeposit()) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (entry.getStatus() != TransferLedgerStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        entry.applyConfirm(adminId, request != null ? request.getAdminMemo() : null);
        TransferLedgerEntry saved = entryRepository.save(entry);
        notificationService.notifyBankDepositConfirmed(saved.getUserId(), saved.getId(), saved.getAmount());
        return toResponse(saved, false);
    }

    @Transactional
    public TransferLedgerEntryResponse settle(Long adminId, Long parentEntryId, SettlementOrRefundRequest request) {
        TransferLedgerEntry parent = entryRepository.findById(parentEntryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        validateParentForResolution(parent);
        if (entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                parent.getId(), TransferLedgerEntryType.SETTLEMENT, TransferLedgerStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                parent.getId(), TransferLedgerEntryType.REFUND, TransferLedgerStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        assertAmountNotExceedsParent(parent, request.getAmount());

        TransferLedgerEntry child = TransferLedgerEntry.createChildEntry(
                parent.getUserId(),
                parent.getSettlementAccountId(),
                TransferLedgerEntryType.SETTLEMENT,
                request.getAmount(),
                parent.getCurrency(),
                parent.getId(),
                request.getAdminMemo(),
                adminId);
        TransferLedgerEntry saved = entryRepository.save(child);
        notificationService.notifyEscrowSettled(saved.getUserId(), saved.getId(), parent.getId(), saved.getAmount());
        return toResponse(saved, false);
    }

    @Transactional
    public TransferLedgerEntryResponse refund(Long adminId, Long parentEntryId, SettlementOrRefundRequest request) {
        TransferLedgerEntry parent = entryRepository.findById(parentEntryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        validateParentForResolution(parent);
        if (entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                parent.getId(), TransferLedgerEntryType.SETTLEMENT, TransferLedgerStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                parent.getId(), TransferLedgerEntryType.REFUND, TransferLedgerStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        assertAmountNotExceedsParent(parent, request.getAmount());

        TransferLedgerEntry child = TransferLedgerEntry.createChildEntry(
                parent.getUserId(),
                parent.getSettlementAccountId(),
                TransferLedgerEntryType.REFUND,
                request.getAmount(),
                parent.getCurrency(),
                parent.getId(),
                request.getAdminMemo(),
                adminId);
        TransferLedgerEntry saved = entryRepository.save(child);
        notificationService.notifyEscrowRefunded(saved.getUserId(), saved.getId(), parent.getId(), saved.getAmount());
        return toResponse(saved, false);
    }

    @Transactional
    public TransferLedgerEntryResponse cancelPending(Long adminId, Long entryId, AdminMemoRequest request) {
        TransferLedgerEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        if (!entry.isRootDeposit()) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (entry.getStatus() != TransferLedgerStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        String memo = request != null ? request.getAdminMemo() : null;
        entry.applyCancel(memo);
        TransferLedgerEntry saved = entryRepository.save(entry);
        return toResponse(saved, false);
    }

    private void validateParentForResolution(TransferLedgerEntry parent) {
        if (!parent.isRootDeposit()) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (parent.getStatus() != TransferLedgerStatus.CONFIRMED) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
    }

    private static void assertAmountNotExceedsParent(TransferLedgerEntry parent, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.LEDGER_AMOUNT_INVALID);
        }
        if (amount.compareTo(parent.getAmount()) > 0) {
            throw new BusinessException(ErrorCode.LEDGER_AMOUNT_INVALID);
        }
    }

    private TransferLedgerEntryResponse toResponse(TransferLedgerEntry entry, boolean maskAccount) {
        SettlementAccount account = settlementAccountRepository.findById(entry.getSettlementAccountId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLEMENT_ACCOUNT_NOT_FOUND));
        SettlementAccountResponse acc = SettlementAccountResponse.from(account, maskAccount);
        return TransferLedgerEntryResponse.of(entry, acc);
    }
}
