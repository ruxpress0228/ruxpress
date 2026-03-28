package com.ruxpress.domain.banktransfer.repository;

import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntry;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerEntryType;
import com.ruxpress.domain.banktransfer.entity.TransferLedgerStatus;
import org.springframework.data.jpa.domain.Specification;

public final class TransferLedgerSpecifications {

    private TransferLedgerSpecifications() {
    }

    public static Specification<TransferLedgerEntry> statusEquals(TransferLedgerStatus status) {
        return (root, query, cb) ->
                status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<TransferLedgerEntry> entryTypeEquals(TransferLedgerEntryType entryType) {
        return (root, query, cb) ->
                entryType == null ? cb.conjunction() : cb.equal(root.get("entryType"), entryType);
    }

    public static Specification<TransferLedgerEntry> userIdEquals(Long userId) {
        return (root, query, cb) ->
                userId == null ? cb.conjunction() : cb.equal(root.get("userId"), userId);
    }
}
