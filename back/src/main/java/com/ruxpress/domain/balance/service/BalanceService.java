package com.ruxpress.domain.balance.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.balance.dto.WalletLedgerEntryResponse;
import com.ruxpress.domain.balance.entity.UserWallet;
import com.ruxpress.domain.balance.entity.WalletLedgerEntry;
import com.ruxpress.domain.balance.entity.WalletLedgerEntryType;
import com.ruxpress.domain.balance.repository.UserWalletRepository;
import com.ruxpress.domain.balance.repository.WalletLedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private final UserWalletRepository walletRepository;
    private final WalletLedgerEntryRepository ledgerRepository;

    @Transactional(readOnly = true)
    public BigDecimal getBalance(Long userId) {
        return walletRepository.findByUserId(userId)
                .map(UserWallet::getBalance)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public PageResponse<WalletLedgerEntryResponse> getLedger(Long userId, int page, int size) {
        Page<WalletLedgerEntry> ledgerPage = ledgerRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        return new PageResponse<>(
                ledgerPage.getContent().stream().map(WalletLedgerEntryResponse::from).toList(),
                ledgerPage.getTotalElements(),
                ledgerPage.getTotalPages(),
                ledgerPage.getNumber(),
                ledgerPage.getSize());
    }

    @Transactional
    public void creditForBankDeposit(Long userId, BigDecimal amount, Long transferLedgerEntryId) {
        String key = "bank_credit:" + transferLedgerEntryId;
        if (ledgerRepository.existsByIdempotencyKey(key)) {
            return;
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.credit(amount);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.creditBankDeposit(userId, amount, transferLedgerEntryId));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
    }

    /**
     * @return true면 신규 차감 반영, false면 동일 구매에 대해 이미 차감됨(멱등)
     */
    @Transactional
    public boolean debitForPurchase(Long userId, BigDecimal amount, Long purchaseRequestId) {
        String key = "purchase_debit:" + purchaseRequestId;
        if (ledgerRepository.existsByIdempotencyKey(key)) {
            return false;
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.debit(amount);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.debitPurchase(userId, amount, purchaseRequestId));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
        return true;
    }

    /**
     * 구매 건 취소·환불 처리 시, 이미 부분 환급된 금액을 제외한 잔여 차감분만 지갑에 돌려줌.
     */
    @Transactional
    public void creditForPurchaseRefund(Long userId, Long purchaseRequestId) {
        String key = "purchase_refund_full:" + purchaseRequestId;
        if (ledgerRepository.existsByIdempotencyKey(key)) {
            return;
        }
        WalletLedgerEntry debit = ledgerRepository
                .findByPurchaseRequestIdAndEntryType(purchaseRequestId, WalletLedgerEntryType.DEBIT_PURCHASE)
                .orElse(null);
        if (debit == null) {
            return;
        }
        BigDecimal adjustments = ledgerRepository.sumAmountByPurchaseAndType(
                purchaseRequestId, WalletLedgerEntryType.CREDIT_PURCHASE_ADJUSTMENT);
        if (adjustments == null) {
            adjustments = BigDecimal.ZERO;
        }
        BigDecimal remainder = debit.getAmount().subtract(adjustments);
        if (remainder.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.credit(remainder);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.creditPurchaseRefund(userId, remainder, purchaseRequestId));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
    }

    /**
     * 실제 비용 확정 등으로 선차감분에서 일부를 지갑으로 돌려줌. {@code idempotencyKey}는 요청 단위로 유일해야 함.
     */
    @Transactional
    public void creditPurchaseAdjustment(
            Long userId,
            Long purchaseRequestId,
            BigDecimal amount,
            String idempotencyKey,
            String memo) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "환급 금액은 양수여야 합니다.");
        }
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "idempotencyKey가 필요합니다.");
        }
        String key = idempotencyKey.trim();
        if (ledgerRepository.existsByIdempotencyKey(key)) {
            return;
        }
        WalletLedgerEntry debit = ledgerRepository
                .findByPurchaseRequestIdAndEntryType(purchaseRequestId, WalletLedgerEntryType.DEBIT_PURCHASE)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PURCHASE_STATE, "구매 선차감 내역이 없습니다."));
        if (!debit.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (ledgerRepository.existsByIdempotencyKey("purchase_refund_full:" + purchaseRequestId)) {
            throw new BusinessException(ErrorCode.INVALID_PURCHASE_STATE, "이미 전체 환불 처리된 구매입니다.");
        }
        BigDecimal adjustments = ledgerRepository.sumAmountByPurchaseAndType(
                purchaseRequestId, WalletLedgerEntryType.CREDIT_PURCHASE_ADJUSTMENT);
        if (adjustments == null) {
            adjustments = BigDecimal.ZERO;
        }
        BigDecimal cap = debit.getAmount().subtract(adjustments);
        if (amount.compareTo(cap) > 0) {
            throw new BusinessException(
                    ErrorCode.LEDGER_AMOUNT_INVALID,
                    "환급 금액이 선차감 잔여분(" + cap.toPlainString() + "원)을 초과합니다.");
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.credit(amount);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.creditPurchaseAdjustment(userId, amount, purchaseRequestId, key, memo));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
    }

    /**
     * 입금 환불에 따른 포인트 차감. 잔액 부족 시 마이너스 허용.
     *
     * @return 차감 후 잔액. 멱등 재처리면 {@code null}
     */
    @Transactional
    public BigDecimal debitForBankRefund(Long userId, BigDecimal amount, Long transferRefundEntryId) {
        String key = "bank_refund_debit:" + transferRefundEntryId;
        if (ledgerRepository.existsByIdempotencyKey(key)) {
            return null;
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.debitAllowNegative(amount);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.debitBankRefund(userId, amount, transferRefundEntryId));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
        return wallet.getBalance();
    }

    private UserWallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(UserWallet.createFor(userId)));
    }
}
