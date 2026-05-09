package com.ruxpress.domain.banktransfer.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.banktransfer.dto.request.AdminMemoRequest;
import com.ruxpress.domain.banktransfer.dto.request.DepositReportRequest;
import com.ruxpress.domain.banktransfer.dto.request.SettlementOrRefundRequest;
import com.ruxpress.domain.banktransfer.dto.response.TransferLedgerEntryResponse;
import com.ruxpress.domain.banktransfer.entity.SettlementAccount;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntry;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus;
import com.ruxpress.domain.banktransfer.repository.SettlementAccountRepository;
import com.ruxpress.domain.banktransfer.repository.TransferLedgerEntryRepository;
import com.ruxpress.domain.balance.service.BalanceService;
import com.ruxpress.domain.notification.service.NotificationService;
import com.ruxpress.domain.user.entity.SignupType;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BankTransferServiceTest {

    @Mock
    private TransferLedgerEntryRepository entryRepository;

    @Mock
    private SettlementAccountRepository settlementAccountRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BalanceService balanceService;

    @InjectMocks
    private BankTransferService bankTransferService;

    private SettlementAccount settlementAccount;
    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        settlementAccount = SettlementAccount.create("테스트은행", "1234567890", "예금주", "메모", 1L);
        ReflectionTestUtils.setField(settlementAccount, "id", 10L);
        user1 = User.create("user1@test.com", "유저1", SignupType.EMAIL);
        ReflectionTestUtils.setField(user1, "id", 1L);
        user2 = User.create("user2@test.com", "유저2", SignupType.EMAIL);
        ReflectionTestUtils.setField(user2, "id", 2L);
    }

    @Test
    void createDepositReport_rejectsNonRootEntryTypes() {
        DepositReportRequest request = new DepositReportRequest();
        request.setSettlementAccountId(10L);
        request.setEntryType(TransferLedgerEntryType.SETTLEMENT);
        request.setAmount(new BigDecimal("100"));

        assertThatThrownBy(() -> bankTransferService.createDepositReport(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    }

    @Test
    void createDepositReport_returnsExistingWhenIdempotencyMatchesSameUser() {
        TransferLedgerEntry existing = TransferLedgerEntry.createRootEntry(
                1L,
                10L,
                TransferLedgerEntryType.ESCROW_HOLD,
                new BigDecimal("1000"),
                "KRW",
                "입금자",
                null,
                null,
                null,
                "idem-1");
        ReflectionTestUtils.setField(existing, "id", 55L);

        when(entryRepository.findByIdempotencyKey("idem-1")).thenReturn(Optional.of(existing));
        when(settlementAccountRepository.findById(10L)).thenReturn(Optional.of(settlementAccount));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

        DepositReportRequest request = new DepositReportRequest();
        request.setSettlementAccountId(10L);
        request.setEntryType(TransferLedgerEntryType.ESCROW_HOLD);
        request.setAmount(new BigDecimal("1000"));
        request.setIdempotencyKey("idem-1");

        TransferLedgerEntryResponse response = bankTransferService.createDepositReport(1L, request);

        assertThat(response.getId()).isEqualTo(55L);
        assertThat(response.getUserEmail()).isEqualTo("user1@test.com");
        verify(entryRepository, never()).save(any());
    }

    @Test
    void confirmDeposit_confirmsPendingRoot_andNotifies() {
        TransferLedgerEntry pending = TransferLedgerEntry.createRootEntry(
                1L,
                10L,
                TransferLedgerEntryType.ESCROW_HOLD,
                new BigDecimal("5000"),
                "KRW",
                "김",
                null,
                null,
                null,
                null);
        ReflectionTestUtils.setField(pending, "id", 77L);

        when(entryRepository.findById(77L)).thenReturn(Optional.of(pending));
        when(entryRepository.save(any(TransferLedgerEntry.class))).thenAnswer(inv -> {
            TransferLedgerEntry saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 77L);
            return saved;
        });
        when(settlementAccountRepository.findById(10L)).thenReturn(Optional.of(settlementAccount));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

        AdminMemoRequest memo = new AdminMemoRequest();
        memo.setAdminMemo("확인완료");

        TransferLedgerEntryResponse response = bankTransferService.confirmDeposit(99L, 77L, memo);

        assertThat(response.getStatus()).isEqualTo(TransferLedgerStatus.CONFIRMED);
        assertThat(response.getUserEmail()).isEqualTo("user1@test.com");
        verify(balanceService).creditForBankDeposit(eq(1L), eq(new BigDecimal("5000")), eq(77L));
        verify(notificationService).notifyBankDepositConfirmed(eq(1L), eq(77L), eq(new BigDecimal("5000")));
    }

    @Test
    void settle_createsSettlementChild_andNotifies() {
        TransferLedgerEntry parent = TransferLedgerEntry.createRootEntry(
                2L,
                10L,
                TransferLedgerEntryType.ESCROW_HOLD,
                new BigDecimal("10000"),
                "KRW",
                null,
                null,
                null,
                null,
                null);
        ReflectionTestUtils.setField(parent, "id", 100L);
        parent.applyConfirm(1L, "입금확정");

        when(entryRepository.findById(100L)).thenReturn(Optional.of(parent));
        when(entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                100L, TransferLedgerEntryType.SETTLEMENT, TransferLedgerStatus.CONFIRMED)).thenReturn(false);
        when(entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                100L, TransferLedgerEntryType.REFUND, TransferLedgerStatus.CONFIRMED)).thenReturn(false);
        when(entryRepository.save(any(TransferLedgerEntry.class))).thenAnswer(inv -> {
            TransferLedgerEntry saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 201L);
            return saved;
        });
        when(settlementAccountRepository.findById(10L)).thenReturn(Optional.of(settlementAccount));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));

        SettlementOrRefundRequest req = new SettlementOrRefundRequest();
        req.setAmount(new BigDecimal("10000"));
        req.setAdminMemo("정산");

        TransferLedgerEntryResponse response = bankTransferService.settle(5L, 100L, req);

        assertThat(response.getEntryType()).isEqualTo(TransferLedgerEntryType.SETTLEMENT);
        assertThat(response.getUserEmail()).isEqualTo("user2@test.com");
        verify(notificationService).notifyEscrowSettled(eq(2L), eq(201L), eq(100L), eq(new BigDecimal("10000")));
    }

    @Test
    void refund_rejectsWhenAmountExceedsParent() {
        TransferLedgerEntry parent = TransferLedgerEntry.createRootEntry(
                1L,
                10L,
                TransferLedgerEntryType.ESCROW_HOLD,
                new BigDecimal("100"),
                "KRW",
                null,
                null,
                null,
                null,
                null);
        ReflectionTestUtils.setField(parent, "id", 1L);
        parent.applyConfirm(1L, null);

        when(entryRepository.findById(1L)).thenReturn(Optional.of(parent));
        when(entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                eq(1L), eq(TransferLedgerEntryType.SETTLEMENT), eq(TransferLedgerStatus.CONFIRMED)))
                .thenReturn(false);
        when(entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                eq(1L), eq(TransferLedgerEntryType.REFUND), eq(TransferLedgerStatus.CONFIRMED)))
                .thenReturn(false);

        SettlementOrRefundRequest req = new SettlementOrRefundRequest();
        req.setAmount(new BigDecimal("101"));

        assertThatThrownBy(() -> bankTransferService.refund(1L, 1L, req))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.LEDGER_AMOUNT_INVALID);

        verify(entryRepository, never()).save(any());
    }

    @Test
    void settle_rejectsWhenRefundAlreadyConfirmed() {
        TransferLedgerEntry parent = TransferLedgerEntry.createRootEntry(
                1L,
                10L,
                TransferLedgerEntryType.ESCROW_HOLD,
                new BigDecimal("1000"),
                "KRW",
                null,
                null,
                null,
                null,
                null);
        ReflectionTestUtils.setField(parent, "id", 50L);
        parent.applyConfirm(1L, null);

        when(entryRepository.findById(50L)).thenReturn(Optional.of(parent));
        when(entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                50L, TransferLedgerEntryType.SETTLEMENT, TransferLedgerStatus.CONFIRMED)).thenReturn(false);
        when(entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                50L, TransferLedgerEntryType.REFUND, TransferLedgerStatus.CONFIRMED)).thenReturn(true);

        SettlementOrRefundRequest req = new SettlementOrRefundRequest();
        req.setAmount(new BigDecimal("500"));

        assertThatThrownBy(() -> bankTransferService.settle(1L, 50L, req))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_LEDGER_STATE);
    }
}
