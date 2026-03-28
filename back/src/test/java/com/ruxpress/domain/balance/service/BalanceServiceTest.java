package com.ruxpress.domain.balance.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.balance.entity.UserWallet;
import com.ruxpress.domain.balance.entity.WalletLedgerEntry;
import com.ruxpress.domain.balance.entity.WalletLedgerEntryType;
import com.ruxpress.domain.balance.repository.UserWalletRepository;
import com.ruxpress.domain.balance.repository.WalletLedgerEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {

    @Mock
    private UserWalletRepository walletRepository;

    @Mock
    private WalletLedgerEntryRepository ledgerRepository;

    @InjectMocks
    private BalanceService balanceService;

    private UserWallet wallet;

    @BeforeEach
    void setUp() {
        wallet = UserWallet.createFor(1L);
        ReflectionTestUtils.setField(wallet, "id", 1L);
    }

    @Test
    void creditForBankDeposit_creditsBalanceAndCreatesLedger() {
        when(ledgerRepository.existsByTransferLedgerEntryId(10L)).thenReturn(false);
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        balanceService.creditForBankDeposit(1L, new BigDecimal("5000"), 10L);

        assertThat(wallet.getBalance()).isEqualByComparingTo("5000");
        ArgumentCaptor<WalletLedgerEntry> captor = ArgumentCaptor.forClass(WalletLedgerEntry.class);
        verify(ledgerRepository).save(captor.capture());
        assertThat(captor.getValue().getEntryType()).isEqualTo(WalletLedgerEntryType.CREDIT_BANK_DEPOSIT);
        assertThat(captor.getValue().getTransferLedgerEntryId()).isEqualTo(10L);
    }

    @Test
    void creditForBankDeposit_idempotent_noOpOnDuplicateTransferLedgerEntryId() {
        when(ledgerRepository.existsByTransferLedgerEntryId(10L)).thenReturn(true);

        balanceService.creditForBankDeposit(1L, new BigDecimal("5000"), 10L);

        verify(walletRepository, never()).save(any());
        verify(ledgerRepository, never()).save(any());
    }

    @Test
    void debitForPurchase_debitsBalanceAndCreatesLedger() {
        wallet.credit(new BigDecimal("10000"));
        when(ledgerRepository.existsByPurchaseRequestIdAndEntryType(20L, WalletLedgerEntryType.DEBIT_PURCHASE)).thenReturn(false);
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        balanceService.debitForPurchase(1L, new BigDecimal("3000"), 20L);

        assertThat(wallet.getBalance()).isEqualByComparingTo("7000");
        ArgumentCaptor<WalletLedgerEntry> captor = ArgumentCaptor.forClass(WalletLedgerEntry.class);
        verify(ledgerRepository).save(captor.capture());
        assertThat(captor.getValue().getEntryType()).isEqualTo(WalletLedgerEntryType.DEBIT_PURCHASE);
        assertThat(captor.getValue().getPurchaseRequestId()).isEqualTo(20L);
    }

    @Test
    void debitForPurchase_idempotent_noOpOnDuplicatePurchaseRequestId() {
        when(ledgerRepository.existsByPurchaseRequestIdAndEntryType(20L, WalletLedgerEntryType.DEBIT_PURCHASE)).thenReturn(true);

        balanceService.debitForPurchase(1L, new BigDecimal("3000"), 20L);

        verify(walletRepository, never()).save(any());
    }

    @Test
    void debitForPurchase_throwsInsufficientBalance() {
        when(ledgerRepository.existsByPurchaseRequestIdAndEntryType(30L, WalletLedgerEntryType.DEBIT_PURCHASE)).thenReturn(false);
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));

        assertThatThrownBy(() -> balanceService.debitForPurchase(1L, new BigDecimal("1000"), 30L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_BALANCE);
    }

    @Test
    void creditForPurchaseRefund_creditsBalanceAndCreatesLedger() {
        wallet.credit(new BigDecimal("5000"));
        when(ledgerRepository.existsByPurchaseRequestIdAndEntryType(20L, WalletLedgerEntryType.CREDIT_PURCHASE_REFUND)).thenReturn(false);
        when(ledgerRepository.existsByPurchaseRequestIdAndEntryType(20L, WalletLedgerEntryType.DEBIT_PURCHASE)).thenReturn(true);
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        balanceService.creditForPurchaseRefund(1L, new BigDecimal("3000"), 20L);

        assertThat(wallet.getBalance()).isEqualByComparingTo("8000");
        ArgumentCaptor<WalletLedgerEntry> captor = ArgumentCaptor.forClass(WalletLedgerEntry.class);
        verify(ledgerRepository).save(captor.capture());
        assertThat(captor.getValue().getEntryType()).isEqualTo(WalletLedgerEntryType.CREDIT_PURCHASE_REFUND);
        assertThat(captor.getValue().getPurchaseRequestId()).isEqualTo(20L);
    }

    @Test
    void creditForPurchaseRefund_idempotent_noOpOnDuplicate() {
        when(ledgerRepository.existsByPurchaseRequestIdAndEntryType(20L, WalletLedgerEntryType.CREDIT_PURCHASE_REFUND)).thenReturn(true);

        balanceService.creditForPurchaseRefund(1L, new BigDecimal("3000"), 20L);

        verify(walletRepository, never()).save(any());
        verify(ledgerRepository, never()).save(any());
    }

    @Test
    void creditForPurchaseRefund_noOpWhenNoDebitExists() {
        when(ledgerRepository.existsByPurchaseRequestIdAndEntryType(20L, WalletLedgerEntryType.CREDIT_PURCHASE_REFUND)).thenReturn(false);
        when(ledgerRepository.existsByPurchaseRequestIdAndEntryType(20L, WalletLedgerEntryType.DEBIT_PURCHASE)).thenReturn(false);

        balanceService.creditForPurchaseRefund(1L, new BigDecimal("3000"), 20L);

        verify(walletRepository, never()).save(any());
        verify(ledgerRepository, never()).save(any());
    }

    @Test
    void debitForBankRefund_debitsWallet() {
        wallet.credit(new BigDecimal("5000"));
        when(ledgerRepository.existsByTransferRefundEntryId(50L)).thenReturn(false);
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        balanceService.debitForBankRefund(1L, new BigDecimal("2000"), 50L);

        assertThat(wallet.getBalance()).isEqualByComparingTo("3000");
        ArgumentCaptor<WalletLedgerEntry> captor = ArgumentCaptor.forClass(WalletLedgerEntry.class);
        verify(ledgerRepository).save(captor.capture());
        assertThat(captor.getValue().getEntryType()).isEqualTo(WalletLedgerEntryType.DEBIT_BANK_REFUND);
    }

    @Test
    void debitForBankRefund_idempotent() {
        when(ledgerRepository.existsByTransferRefundEntryId(50L)).thenReturn(true);

        balanceService.debitForBankRefund(1L, new BigDecimal("2000"), 50L);

        verify(walletRepository, never()).save(any());
    }

    @Test
    void debitForBankRefund_throwsInsufficientBalance() {
        wallet.credit(new BigDecimal("1000"));
        when(ledgerRepository.existsByTransferRefundEntryId(60L)).thenReturn(false);
        when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(wallet));

        assertThatThrownBy(() -> balanceService.debitForBankRefund(1L, new BigDecimal("2000"), 60L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_BALANCE);
    }

    @Test
    void getBalance_returnsZeroWhenNoWallet() {
        when(walletRepository.findByUserId(999L)).thenReturn(Optional.empty());

        BigDecimal balance = balanceService.getBalance(999L);

        assertThat(balance).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void creditForBankDeposit_createsWalletWhenNotExists() {
        when(ledgerRepository.existsByTransferLedgerEntryId(15L)).thenReturn(false);
        when(walletRepository.findByUserId(99L)).thenReturn(Optional.empty());

        UserWallet newWallet = UserWallet.createFor(99L);
        ReflectionTestUtils.setField(newWallet, "id", 99L);
        when(walletRepository.save(any(UserWallet.class))).thenAnswer(inv -> {
            UserWallet w = inv.getArgument(0);
            if (w.getId() == null) {
                ReflectionTestUtils.setField(w, "id", 99L);
            }
            return w;
        });
        when(ledgerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        balanceService.creditForBankDeposit(99L, new BigDecimal("1000"), 15L);

        verify(walletRepository, times(2)).save(any());
    }
}
