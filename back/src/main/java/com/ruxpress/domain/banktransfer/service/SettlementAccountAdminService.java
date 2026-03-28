package com.ruxpress.domain.banktransfer.service;

import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.banktransfer.dto.request.SettlementAccountCreateRequest;
import com.ruxpress.domain.banktransfer.dto.request.SettlementAccountUpdateRequest;
import com.ruxpress.domain.banktransfer.dto.response.SettlementAccountResponse;
import com.ruxpress.domain.banktransfer.entity.SettlementAccount;
import com.ruxpress.domain.banktransfer.repository.SettlementAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementAccountAdminService {

    private final SettlementAccountRepository settlementAccountRepository;

    public List<SettlementAccountResponse> listAll() {
        return settlementAccountRepository.findAll().stream()
                .filter(a -> a.getDeletedAt() == null)
                .map(a -> SettlementAccountResponse.from(a, false))
                .toList();
    }

    public SettlementAccountResponse getById(Long id) {
        SettlementAccount account = settlementAccountRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLEMENT_ACCOUNT_NOT_FOUND));
        return SettlementAccountResponse.from(account, false);
    }

    @Transactional
    public SettlementAccountResponse create(Long adminId, SettlementAccountCreateRequest request) {
        SettlementAccount account = SettlementAccount.create(
                request.getBankName(),
                request.getAccountNumber(),
                request.getAccountHolder(),
                request.getDisplayMemo(),
                adminId);
        SettlementAccount saved = settlementAccountRepository.save(account);
        return SettlementAccountResponse.from(saved, false);
    }

    @Transactional
    public SettlementAccountResponse update(Long id, SettlementAccountUpdateRequest request) {
        SettlementAccount account = settlementAccountRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLEMENT_ACCOUNT_NOT_FOUND));
        account.update(
                request.getBankName(),
                request.getAccountNumber(),
                request.getAccountHolder(),
                request.getDisplayMemo(),
                request.getActive());
        return SettlementAccountResponse.from(account, false);
    }

    @Transactional
    public void softDelete(Long id) {
        SettlementAccount account = settlementAccountRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLEMENT_ACCOUNT_NOT_FOUND));
        account.markDeleted();
    }
}
