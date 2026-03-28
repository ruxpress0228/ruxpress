package com.ruxpress.domain.purchase.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "purchase_requests")
public class PurchaseRequest extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "request_number", nullable = false, length = 30)
    private String requestNumber;

    @Column(name = "product_name", nullable = false, length = 300)
    private String productName;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(columnDefinition = "JSON")
    private String urls;

    @Column(columnDefinition = "JSON")
    private String options;

    @Column(name = "price_rub", precision = 18, scale = 2)
    private BigDecimal priceRub;

    @Column(name = "price_krw", precision = 18, scale = 2)
    private BigDecimal priceKrw;

    @Column(name = "exchange_rate_id")
    private Long exchangeRateId;

    @Column(name = "fee_amount", precision = 18, scale = 2)
    private BigDecimal feeAmount;

    @Column(name = "total_amount_krw", precision = 18, scale = 2)
    private BigDecimal totalAmountKrw;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseRequestStatus status = PurchaseRequestStatus.DRAFT;

    @Column(name = "admin_memo", columnDefinition = "TEXT")
    private String adminMemo;

    @Column(name = "assigned_admin_id")
    private Long assignedAdminId;

    public static PurchaseRequest create(
            Long userId,
            String requestNumber,
            String productName,
            Integer quantity,
            String urls,
            String options,
            BigDecimal priceRub,
            BigDecimal priceKrw,
            Long exchangeRateId,
            BigDecimal feeAmount,
            BigDecimal totalAmountKrw,
            String memo,
            PurchaseRequestStatus status
    ) {
        PurchaseRequest pr = new PurchaseRequest();
        pr.userId = userId;
        pr.requestNumber = requestNumber;
        pr.productName = productName;
        pr.quantity = quantity != null ? quantity : 1;
        pr.urls = urls;
        pr.options = options;
        pr.priceRub = priceRub;
        pr.priceKrw = priceKrw;
        pr.exchangeRateId = exchangeRateId;
        pr.feeAmount = feeAmount;
        pr.totalAmountKrw = totalAmountKrw;
        pr.memo = memo;
        pr.status = status != null ? status : PurchaseRequestStatus.DRAFT;
        return pr;
    }

    public void changeStatus(PurchaseRequestStatus newStatus) {
        this.status = newStatus;
    }

    public void updateAdminMemo(String adminMemo) {
        if (adminMemo != null) {
            this.adminMemo = adminMemo;
        }
    }

    public void assignAdmin(Long adminId) {
        this.assignedAdminId = adminId;
    }
}
