package com.ruxpress.domain.banktransfer.service;

import com.ruxpress.common.dto.AttachmentResponse;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.entity.Attachment;
import com.ruxpress.common.entity.AttachmentRefType;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.repository.AttachmentRepository;
import com.ruxpress.common.storage.FileStoragePort;
import com.ruxpress.common.storage.FileStorageUtil;
import com.ruxpress.common.util.ModulePrefix;
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
import com.ruxpress.domain.balance.service.BalanceService;
import com.ruxpress.domain.notification.service.NotificationService;
import com.ruxpress.domain.user.entity.User;
import com.ruxpress.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BankTransferService {

    private final TransferLedgerEntryRepository entryRepository;
    private final SettlementAccountRepository settlementAccountRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final BalanceService balanceService;
    private final AttachmentRepository attachmentRepository;
    private final FileStoragePort fileStoragePort;

    public List<SettlementAccountResponse> listActiveSettlementAccountsForUser() {
        return settlementAccountRepository.findByActiveTrueAndDeletedAtIsNullOrderByIdAsc().stream()
                .map(a -> SettlementAccountResponse.from(a, false))
                .toList();
    }

    @Transactional
    public TransferLedgerEntryResponse createDepositReport(Long userId, DepositReportRequest request) {
        return createDepositReport(userId, request, List.of());
    }

    @Transactional
    public TransferLedgerEntryResponse createDepositReport(Long userId, DepositReportRequest request,
            List<MultipartFile> files) {
        List<MultipartFile> fileList = files != null ? files : List.of();
        if (fileList.size() > FileStorageUtil.MAX_IMAGE_COUNT) {
            throw new BusinessException(ErrorCode.FILE_COUNT_EXCEEDED);
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
                // 동일 멱등키 재요청은 신규 첨부를 만들지 않는다.
                return toResponse(e, false, resolveUserEmail(userId));
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

        if (!fileList.isEmpty()) {
            saveAttachments(saved.getId(), fileList);
        }

        return toResponse(saved, false, resolveUserEmail(userId));
    }

    private void saveAttachments(Long entryId, List<MultipartFile> files) {
        String directory = ModulePrefix.BANK_TRANSFER;
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            FileStorageUtil.validateImageOrThrow(file);
            try {
                String storedUrl = fileStoragePort.store(directory, file);
                Attachment attachment = Attachment.create(
                        AttachmentRefType.BANK_TRANSFER,
                        entryId,
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        storedUrl,
                        (int) file.getSize(),
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        i);
                attachmentRepository.save(attachment);
            } catch (Exception e) {
                log.error("Bank transfer attachment upload failed. entryId={}, idx={}", entryId, i, e);
                throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, e.getMessage());
            }
        }
    }

    public PageResponse<TransferLedgerEntryResponse> listMyEntries(Long userId, PageRequest pageRequest) {
        Page<TransferLedgerEntry> page = entryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest);
        String email = resolveUserEmail(userId);
        return new PageResponse<>(
                page.getContent().stream().map(e -> toResponse(e, false, email)).toList(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize());
    }

    public TransferLedgerEntryResponse getMyEntry(Long userId, Long entryId) {
        TransferLedgerEntry entry = entryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        return toResponse(entry, false, resolveUserEmail(userId));
    }

    public LedgerReceiptResponse getMyReceipt(Long userId, Long entryId) {
        TransferLedgerEntry entry = entryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        entry.assertIssuableReceipt();
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
                SettlementAccountResponse.from(account, false),
                entry.getDepositorName());
    }

    public PageResponse<TransferLedgerEntryResponse> listForAdmin(
            TransferLedgerStatus status,
            TransferLedgerEntryType entryType,
            String userEmail,
            PageRequest pageRequest) {
        Long filterUserId = null;
        if (userEmail != null && !userEmail.isBlank()) {
            filterUserId = userRepository.findByEmail(userEmail.trim())
                    .map(User::getId)
                    .orElse(null);
            if (filterUserId == null) {
                return new PageResponse<>(
                        List.of(),
                        0,
                        0,
                        pageRequest.getPageNumber(),
                        pageRequest.getPageSize());
            }
        }
        Specification<TransferLedgerEntry> spec = Specification.allOf(
                TransferLedgerSpecifications.statusEquals(status),
                TransferLedgerSpecifications.entryTypeEquals(entryType),
                TransferLedgerSpecifications.userIdEquals(filterUserId));
        Page<TransferLedgerEntry> page = entryRepository.findAll(spec, pageRequest);
        List<Long> userIds = page.getContent().stream().map(TransferLedgerEntry::getUserId).distinct().toList();
        Map<Long, String> emailByUserId = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(u -> emailByUserId.put(u.getId(), u.getEmail()));
        }
        return new PageResponse<>(
                page.getContent().stream()
                        .map(e -> toResponse(e, false, emailByUserId.get(e.getUserId())))
                        .toList(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize());
    }

    public TransferLedgerEntryResponse getForAdmin(Long entryId) {
        TransferLedgerEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        return toResponse(entry, false, resolveUserEmail(entry.getUserId()));
    }

    @Transactional
    public TransferLedgerEntryResponse confirmDeposit(Long adminId, Long entryId, AdminMemoRequest request) {
        TransferLedgerEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        entry.applyConfirm(adminId, request != null ? request.getAdminMemo() : null);
        TransferLedgerEntry saved = entryRepository.save(entry);
        balanceService.creditForBankDeposit(saved.getUserId(), saved.getAmount(), saved.getId());
        notificationService.notifyBankDepositConfirmed(saved.getUserId(), saved.getId(), saved.getAmount());
        return toResponse(saved, false, resolveUserEmail(saved.getUserId()));
    }

    @Transactional
    public TransferLedgerEntryResponse settle(Long adminId, Long parentEntryId, SettlementOrRefundRequest request) {
        TransferLedgerEntry parent = entryRepository.findById(parentEntryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        parent.assertConfirmedRootForChildLedger();
        if (entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                parent.getId(), TransferLedgerEntryType.SETTLEMENT, TransferLedgerStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                parent.getId(), TransferLedgerEntryType.REFUND, TransferLedgerStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        parent.assertChildAmountAllowed(request.getAmount());

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
        notificationService.notifySettled(saved.getUserId(), saved.getId(), parent.getId(), saved.getAmount());
        return toResponse(saved, false, resolveUserEmail(saved.getUserId()));
    }

    @Transactional
    public TransferLedgerEntryResponse refund(Long adminId, Long parentEntryId, SettlementOrRefundRequest request) {
        TransferLedgerEntry parent = entryRepository.findById(parentEntryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        parent.assertConfirmedRootForChildLedger();
        if (entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                parent.getId(), TransferLedgerEntryType.SETTLEMENT, TransferLedgerStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        if (entryRepository.existsByParentEntryIdAndEntryTypeAndStatus(
                parent.getId(), TransferLedgerEntryType.REFUND, TransferLedgerStatus.CONFIRMED)) {
            throw new BusinessException(ErrorCode.INVALID_LEDGER_STATE);
        }
        parent.assertChildAmountAllowed(request.getAmount());

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
        notificationService.notifyRefunded(saved.getUserId(), saved.getId(), parent.getId(), saved.getAmount());
        return toResponse(saved, false, resolveUserEmail(saved.getUserId()));
    }

    @Transactional
    public TransferLedgerEntryResponse cancelPending(Long adminId, Long entryId, AdminMemoRequest request) {
        TransferLedgerEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANK_LEDGER_NOT_FOUND));
        String memo = request != null ? request.getAdminMemo() : null;
        entry.applyCancel(memo);
        TransferLedgerEntry saved = entryRepository.save(entry);
        return toResponse(saved, false, resolveUserEmail(saved.getUserId()));
    }

    private String resolveUserEmail(Long userId) {
        return userRepository.findById(userId).map(User::getEmail).orElse(null);
    }

    private TransferLedgerEntryResponse toResponse(TransferLedgerEntry entry, boolean maskAccount, String userEmail) {
        SettlementAccount account = settlementAccountRepository.findById(entry.getSettlementAccountId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLEMENT_ACCOUNT_NOT_FOUND));
        SettlementAccountResponse acc = SettlementAccountResponse.from(account, maskAccount);
        List<AttachmentResponse> attachments = attachmentRepository
                .findByRefTypeAndRefIdOrderBySortOrder(AttachmentRefType.BANK_TRANSFER, entry.getId())
                .stream()
                .map(a -> new AttachmentResponse(
                        a.getId(),
                        a.getOriginalFilename(),
                        a.getStoredUrl(),
                        a.getThumbnailUrl(),
                        fileStoragePort.getViewUrl(a.getStoredUrl()),
                        a.getFileSize(),
                        a.getMimeType(),
                        a.isUploadedByAdmin()))
                .toList();
        return TransferLedgerEntryResponse.of(entry, acc, userEmail, attachments);
    }
}
