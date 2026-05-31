package com.ruxpress.domain.balance.service;

import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.domain.balance.dto.AdminUserWalletResponse;
import com.ruxpress.domain.balance.dto.AdminWalletAdjustRequest;
import com.ruxpress.domain.balance.dto.AdminWalletAdjustResponse;
import com.ruxpress.domain.balance.dto.WalletLedgerEntryResponse;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminWalletService {

    private final UserRepository userRepository;
    private final BalanceService balanceService;

    public PageResponse<AdminUserWalletResponse> listUsers(String keyword, Pageable pageable) {
        Page<User> page = resolveUserPage(keyword, pageable);
        return new PageResponse<>(
                page.getContent().stream()
                        .map(u -> AdminUserWalletResponse.of(u, balanceService.getBalance(u.getId())))
                        .toList(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize());
    }

    public AdminUserWalletResponse getUserWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
        return AdminUserWalletResponse.of(user, balanceService.getBalance(userId));
    }

    public PageResponse<WalletLedgerEntryResponse> getUserLedger(Long userId, int page, int size) {
        assertUserExists(userId);
        return balanceService.getLedger(userId, page, size);
    }

    @Transactional
    public AdminWalletAdjustResponse credit(Long adminId, Long userId, AdminWalletAdjustRequest request) {
        assertUserExists(userId);
        String memo = formatAdminMemo(adminId, request.getMemo());
        WalletLedgerEntryResponse entry = balanceService.adminCredit(userId, request.getAmount(), adminId, memo);
        return new AdminWalletAdjustResponse(userId, balanceService.getBalance(userId), entry);
    }

    @Transactional
    public AdminWalletAdjustResponse debit(Long adminId, Long userId, AdminWalletAdjustRequest request) {
        assertUserExists(userId);
        String memo = formatAdminMemo(adminId, request.getMemo());
        WalletLedgerEntryResponse entry = balanceService.adminDebit(userId, request.getAmount(), adminId, memo);
        return new AdminWalletAdjustResponse(userId, balanceService.getBalance(userId), entry);
    }

    private Page<User> resolveUserPage(String keyword, Pageable pageable) {
        if (keyword != null && !keyword.isBlank()) {
            return userRepository.searchByKeyword(keyword.trim(), pageable);
        }
        return userRepository.findByDeletedAtIsNullOrderByCreatedAtDesc(pageable);
    }

    private void assertUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }
    }

    private String formatAdminMemo(Long adminId, String memo) {
        String prefix = "[admin:" + adminId + "]";
        if (memo == null || memo.isBlank()) {
            return prefix;
        }
        return prefix + " " + memo.trim();
    }
}
