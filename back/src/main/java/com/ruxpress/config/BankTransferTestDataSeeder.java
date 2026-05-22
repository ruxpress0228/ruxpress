package com.ruxpress.config;

import com.ruxpress.domain.admin.repository.AdminRepository;
import com.ruxpress.domain.banktransfer.entity.SettlementAccount;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntry;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.repository.SettlementAccountRepository;
import com.ruxpress.domain.banktransfer.repository.TransferLedgerEntryRepository;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * local/docker: 계좌이체 화면·REQ2-06 테스트용 입금 계좌·입금 내역 시드.
 */
@Slf4j
@Component
@Profile({"local", "docker"})
@Order(20)
@RequiredArgsConstructor
public class BankTransferTestDataSeeder implements CommandLineRunner {

    private static final List<String> SEED_USER_EMAILS =
            List.of("test1@test.com", "test2@test.com", "test3@test.com");

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final SettlementAccountRepository settlementAccountRepository;
    private final TransferLedgerEntryRepository transferLedgerEntryRepository;

    @Override
    public void run(String... args) {
        var adminId = adminRepository.findAll().stream().findFirst().map(a -> a.getId()).orElse(null);
        if (adminId == null) {
            return;
        }

        ensureSettlementAccount(
                adminId,
                "신한은행",
                "12345678901234",
                "럭스프레스",
                "입금 시 요청 번호를 입금자명에 포함해 주세요.");
        ensureSettlementAccount(
                adminId,
                "KB국민은행",
                "11012345678901",
                "럭스프레스(국민)",
                "국민 계좌 — 로컬 테스트용");

        var primary = settlementAccountRepository
                .findByAccountNumberAndDeletedAtIsNull("12345678901234")
                .orElse(null);
        if (primary == null) {
            return;
        }

        for (String email : SEED_USER_EMAILS) {
            userRepository.findByEmail(email).ifPresent(user -> seedLedgerSamples(user.getId(), primary.getId(), adminId));
        }
    }

    private void ensureSettlementAccount(
            Long adminId,
            String bankName,
            String accountNumber,
            String accountHolder,
            String displayMemo) {
        if (settlementAccountRepository.findByAccountNumberAndDeletedAtIsNull(accountNumber).isPresent()) {
            return;
        }
        settlementAccountRepository.save(
                Objects.requireNonNull(SettlementAccount.create(bankName, accountNumber, accountHolder, displayMemo, adminId)));
        log.info("Seed settlement account: {} {}", bankName, accountNumber);
    }

    private void seedLedgerSamples(Long userId, Long settlementAccountId, Long adminId) {
        if (transferLedgerEntryRepository.countByUserId(userId) > 0) {
            return;
        }

        var pending = TransferLedgerEntry.createRootEntry(
                userId,
                settlementAccountId,
                TransferLedgerEntryType.DEPOSIT,
                new BigDecimal("50000"),
                "KRW",
                "테스트입금자",
                "시드 데이터 (확인 대기)",
                null,
                null,
                "seed-pending-u" + userId);
        transferLedgerEntryRepository.save(Objects.requireNonNull(pending));

        var confirmed = TransferLedgerEntry.createRootEntry(
                userId,
                settlementAccountId,
                TransferLedgerEntryType.DEPOSIT,
                new BigDecimal("100000"),
                "KRW",
                "테스트입금자",
                "시드 데이터 (확정)",
                null,
                null,
                "seed-confirmed-u" + userId);
        confirmed.applyConfirm(adminId, "시드 자동 확정");
        transferLedgerEntryRepository.save(confirmed);

        log.info("Seed bank transfer ledger samples for userId={}", userId);
    }
}
