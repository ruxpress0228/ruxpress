package com.ruxpress.domain.purchase.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruxpress.common.dto.PageResponse;
import com.ruxpress.common.exception.BusinessException;
import com.ruxpress.common.exception.ErrorCode;
import com.ruxpress.common.util.IDGenerateUtil;
import com.ruxpress.domain.balance.service.BalanceService;
import com.ruxpress.domain.notification.service.NotificationService;
import com.ruxpress.domain.purchase.dto.request.AdminPurchaseStatusRequest;
import com.ruxpress.domain.purchase.dto.request.AdminPurchaseWalletCreditRequest;
import com.ruxpress.domain.purchase.dto.request.PurchaseRequestCreateRequest;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestListResponse;
import com.ruxpress.domain.purchase.dto.response.PurchaseRequestResponse;
import com.ruxpress.domain.purchase.entity.PurchaseRequest;
import com.ruxpress.domain.purchase.entity.PurchaseRequestStatus;
import com.ruxpress.domain.purchase.repository.PurchaseRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ObjectMapper objectMapper;
    private final BalanceService balanceService;
    private final NotificationService notificationService;

    @Transactional
    public PurchaseRequestResponse createPurchaseRequest(Long userId, PurchaseRequestCreateRequest request) {
        PurchaseRequestStatus effectiveStatus = request.getStatus() != null
                ? request.getStatus() : PurchaseRequestStatus.DRAFT;
        if (effectiveStatus == PurchaseRequestStatus.SUBMITTED) {
            if (request.getTotalAmountKrw() == null || request.getTotalAmountKrw().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException(ErrorCode.INVALID_INPUT, "차감 금액은 양수여야 합니다.");
            }
        }

        String requestNumber = IDGenerateUtil.generatePurchaseRequestNumber();
        PurchaseRequest purchaseRequest = PurchaseRequest.create(
                userId,
                requestNumber,
                request.getProductName(),
                request.getQuantity(),
                writeJson(request.getUrls()),
                writeJson(request.getOptions()),
                request.getPriceRub(),
                request.getPriceKrw(),
                request.getExchangeRateId(),
                request.getFeeAmount(),
                request.getTotalAmountKrw(),
                request.getMemo(),
                effectiveStatus);
        PurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);
        if (effectiveStatus == PurchaseRequestStatus.SUBMITTED) {
            balanceService.debitForPurchase(userId, request.getTotalAmountKrw(), saved.getId());
            saved.recordChargedAmount(request.getTotalAmountKrw());
            saved = purchaseRequestRepository.save(saved);
        }
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseRequestListResponse> getMyPurchaseRequests(
            Long userId,
            PurchaseRequestStatus status,
            Pageable pageable) {
        Page<PurchaseRequest> page = status == null
                ? purchaseRequestRepository.findByUserIdAndDeletedAtIsNull(userId, pageable)
                : purchaseRequestRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, status, pageable);

        List<PurchaseRequestListResponse> content = page.getContent().stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize());
    }

    @Transactional(readOnly = true)
    public List<PurchaseRequestListResponse> getRecentMyPurchaseRequests(Long userId) {
        return purchaseRequestRepository.findTop3ByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId).stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseRequestResponse> getAdminPurchaseRequests(
            PurchaseRequestStatus status, Pageable pageable) {
        Page<PurchaseRequest> page = status == null
                ? purchaseRequestRepository.findByDeletedAtIsNull(pageable)
                : purchaseRequestRepository.findByStatusAndDeletedAtIsNull(status, pageable);
        List<PurchaseRequestResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new PageResponse<>(content, page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponse getAdminPurchaseRequestDetail(Long id) {
        PurchaseRequest pr = purchaseRequestRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCHASE_NOT_FOUND));
        return toResponse(pr);
    }

    @Transactional
    public PurchaseRequestResponse updatePurchaseRequestStatus(Long id, Long adminId, AdminPurchaseStatusRequest request) {
        PurchaseRequest pr = purchaseRequestRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCHASE_NOT_FOUND));
        pr.changeStatus(request.getStatus());
        pr.updateAdminMemo(request.getAdminMemo());
        if (adminId != null) {
            pr.assignAdmin(adminId);
        }
        PurchaseRequest saved = purchaseRequestRepository.save(pr);

        if (request.getStatus() == PurchaseRequestStatus.REFUNDED) {
            balanceService.creditForPurchaseRefund(saved.getUserId(), saved.getId());
        }

        return toResponse(saved);
    }

    @Transactional
    public PurchaseRequestResponse creditPurchaseWalletAdjustment(
            Long id,
            Long adminId,
            AdminPurchaseWalletCreditRequest request) {
        PurchaseRequest pr = purchaseRequestRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCHASE_NOT_FOUND));
        if (adminId != null) {
            pr.assignAdmin(adminId);
        }
        pr.recordSettledAmount(request.getSettledAmountKrw());
        if (request.getAdminMemo() != null && !request.getAdminMemo().isBlank()) {
            pr.updateAdminMemo(request.getAdminMemo());
        }
        purchaseRequestRepository.save(pr);

        String memo = request.getAdminMemo();
        balanceService.creditPurchaseAdjustment(
                pr.getUserId(),
                pr.getId(),
                request.getAmount(),
                request.getIdempotencyKey(),
                memo);

        notificationService.notifyWalletPurchaseAdjustment(
                pr.getUserId(),
                pr.getId(),
                request.getAmount());

        return toResponse(purchaseRequestRepository.findById(id).orElse(pr));
    }

    private PurchaseRequestListResponse toListResponse(PurchaseRequest purchaseRequest) {
        return new PurchaseRequestListResponse(
                purchaseRequest.getId(),
                purchaseRequest.getRequestNumber(),
                purchaseRequest.getProductName(),
                purchaseRequest.getQuantity(),
                purchaseRequest.getTotalAmountKrw(),
                purchaseRequest.getChargedAmountKrw(),
                purchaseRequest.getSettledAmountKrw(),
                purchaseRequest.getStatus(),
                purchaseRequest.getCreatedAt());
    }

    private PurchaseRequestResponse toResponse(PurchaseRequest purchaseRequest) {
        return new PurchaseRequestResponse(
                purchaseRequest.getId(),
                purchaseRequest.getUserId(),
                purchaseRequest.getRequestNumber(),
                purchaseRequest.getProductName(),
                purchaseRequest.getQuantity(),
                readUrls(purchaseRequest.getUrls()),
                readJsonNode(purchaseRequest.getOptions()),
                purchaseRequest.getPriceRub(),
                purchaseRequest.getPriceKrw(),
                purchaseRequest.getExchangeRateId(),
                purchaseRequest.getFeeAmount(),
                purchaseRequest.getTotalAmountKrw(),
                purchaseRequest.getChargedAmountKrw(),
                purchaseRequest.getSettledAmountKrw(),
                purchaseRequest.getMemo(),
                purchaseRequest.getStatus(),
                purchaseRequest.getAdminMemo(),
                purchaseRequest.getAssignedAdminId(),
                purchaseRequest.getCreatedAt(),
                purchaseRequest.getUpdatedAt());
    }

    private String writeJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private List<String> readUrls(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private JsonNode readJsonNode(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
