package com.ruxpress.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 에스크로 제거(988e0ef) 이전 DB에 남은 {@code ESCROW_HOLD} 원장을 {@code DEPOSIT}으로 정리.
 * Hibernate enum 매핑 실패(500) 방지.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransferLedgerLegacyMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        Integer escrowRows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM transfer_ledger_entries WHERE entry_type = 'ESCROW_HOLD'",
                Integer.class);
        if (escrowRows == null || escrowRows == 0) {
            return;
        }
        int updated = jdbcTemplate.update(
                "UPDATE transfer_ledger_entries SET entry_type = 'DEPOSIT' WHERE entry_type = 'ESCROW_HOLD'");
        log.info("Migrated {} transfer_ledger_entries from ESCROW_HOLD to DEPOSIT", updated);
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE transfer_ledger_entries MODIFY entry_type "
                            + "ENUM('DEPOSIT', 'SETTLEMENT', 'REFUND') NOT NULL COMMENT '원장 유형'");
        } catch (Exception ex) {
            log.warn("Could not narrow entry_type ENUM (may already be migrated): {}", ex.getMessage());
        }
    }
}
