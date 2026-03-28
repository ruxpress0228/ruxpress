package com.ruxpress.domain.balance.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.balance.dto.WalletLedgerEntryResponse;
import com.ruxpress.domain.balance.entity.UserWallet;
import com.ruxpress.domain.balance.entity.WalletLedgerEntry;
import com.ruxpress.domain.balance.repository.UserWalletRepository;
import com.ruxpress.domain.balance.repository.WalletLedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ruxpress.domain.balance.entity.WalletLedgerEntryType;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private static final int MAX_RETRY = 3;

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

    /**
     * 입금 확정 시 지갑 적립. 이미 처리된 transfer_ledger_entry_id는 no-op.
     */
    @Transactional
    public void creditForBankDeposit(Long userId, BigDecimal amount, Long transferLedgerEntryId) {
        if (ledgerRepository.existsByTransferLedgerEntryId(transferLedgerEntryId)) {
            return;
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.credit(amount);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.creditBankDeposit(userId, amount, transferLedgerEntryId));
        } catch (DataIntegrityViolationException e) {
            // UK 중복 → 동시 요청에 의한 멱등 충돌, 적립 취소를 위해 예외 전파
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
    }

    /**
     * 구매 요청 제출 시 차감. 잔액 부족이면 BusinessException. 이미 처리된 purchase_request_id는 no-op.
     */
    @Transactional
    public void debitForPurchase(Long userId, BigDecimal amount, Long purchaseRequestId) {
        if (ledgerRepository.existsByPurchaseRequestIdAndEntryType(purchaseRequestId, WalletLedgerEntryType.DEBIT_PURCHASE)) {
            return;
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.debit(amount);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.debitPurchase(userId, amount, purchaseRequestId));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
    }

    /**
     * 구매 요청 환불 시 잔액 환급. 이미 환급된 purchase_request_id는 no-op.
     * 기존 DEBIT_PURCHASE 원장이 없으면 차감된 적이 없으므로 환급하지 않음.
     */
    @Transactional
    public void creditForPurchaseRefund(Long userId, BigDecimal amount, Long purchaseRequestId) {
        if (ledgerRepository.existsByPurchaseRequestIdAndEntryType(purchaseRequestId, WalletLedgerEntryType.CREDIT_PURCHASE_REFUND)) {
            return;
        }
        if (!ledgerRepository.existsByPurchaseRequestIdAndEntryType(purchaseRequestId, WalletLedgerEntryType.DEBIT_PURCHASE)) {
            return;
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.credit(amount);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.creditPurchaseRefund(userId, amount, purchaseRequestId));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
    }

    /**
     * 이체 환불에 의한 차감 (부모가 DEPOSIT인 경우만 호출). 잔액 부족이면 전체 롤백.
     */
    @Transactional
    public void debitForBankRefund(Long userId, BigDecimal amount, Long transferRefundEntryId) {
        if (ledgerRepository.existsByTransferRefundEntryId(transferRefundEntryId)) {
            return;
        }
        UserWallet wallet = getOrCreateWallet(userId);
        wallet.debit(amount);
        walletRepository.save(wallet);
        try {
            ledgerRepository.save(WalletLedgerEntry.debitBankRefund(userId, amount, transferRefundEntryId));
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
        }
    }

    private UserWallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(UserWallet.createFor(userId)));
    }
}
