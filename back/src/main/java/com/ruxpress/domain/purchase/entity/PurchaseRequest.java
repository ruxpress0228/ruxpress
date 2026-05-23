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

    @Column(name = "request_name", nullable = false, length = 300)
    private String requestName;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(columnDefinition = "JSON")
    private String urls;

    @Column(columnDefinition = "JSON")
    private String options;

    @Column(name = "price_rub", precision = 18, scale = 2)
    private BigDecimal priceRub;

    /** 표시·스냅샷 기준 외화 (RUB, USD, CNY). price_rub 컬럼에 quote 금액 저장 */
    @Column(name = "quote_currency", nullable = false, length = 3)
    private String quoteCurrency = "RUB";

    @Column(name = "price_krw", precision = 18, scale = 2)
    private BigDecimal priceKrw;

    @Column(name = "exchange_rate_id")
    private Long exchangeRateId;

    @Column(name = "fee_amount", precision = 18, scale = 2)
    private BigDecimal feeAmount;

    @Column(name = "total_amount_krw", precision = 18, scale = 2)
    private BigDecimal totalAmountKrw;

    /** 제출 시 지갑에서 실제 차감한 금액(예상 배송비 포함 선차감 등). 미설정 시 totalAmountKrw와 동일하게 취급 */
    @Column(name = "charged_amount_krw", precision = 18, scale = 2)
    private BigDecimal chargedAmountKrw;

    /** 관리자가 확정한 실제 비용(참고) */
    @Column(name = "settled_amount_krw", precision = 18, scale = 2)
    private BigDecimal settledAmountKrw;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseRequestStatus status = PurchaseRequestStatus.DRAFT;

    @Column(name = "admin_memo", columnDefinition = "TEXT")
    private String adminMemo;

    @Column(name = "assigned_admin_id")
    private Long assignedAdminId;

    @Column(name = "tracking_number", length = 64)
    private String trackingNumber;

    @Column(name = "shipping_user_address_id")
    private Long shippingUserAddressId;

    @Column(name = "shipping_label", length = 50)
    private String shippingLabel;

    @Column(name = "shipping_recipient_name", length = 50)
    private String shippingRecipientName;

    @Column(name = "shipping_recipient_phone", length = 20)
    private String shippingRecipientPhone;

    @Column(name = "shipping_postal_code", length = 10)
    private String shippingPostalCode;

    @Column(name = "shipping_address_line1", length = 255)
    private String shippingAddressLine1;

    @Column(name = "shipping_address_line2", length = 255)
    private String shippingAddressLine2;

    public static PurchaseRequest create(
            Long userId,
            String requestNumber,
            String requestName,
            Integer quantity,
            String urls,
            String options,
            BigDecimal priceRub,
            String quoteCurrency,
            BigDecimal priceKrw,
            Long exchangeRateId,
            BigDecimal feeAmount,
            BigDecimal totalAmountKrw,
            String memo,
            PurchaseRequestStatus status,
            PurchaseShippingSnapshot shippingSnapshot
    ) {
        PurchaseRequest pr = new PurchaseRequest();
        pr.userId = userId;
        pr.requestNumber = requestNumber;
        pr.requestName = requestName;
        pr.quantity = quantity != null ? quantity : 1;
        pr.urls = urls;
        pr.options = options;
        pr.priceRub = priceRub;
        pr.quoteCurrency = (quoteCurrency != null && !quoteCurrency.isBlank()) ? quoteCurrency.toUpperCase() : "RUB";
        pr.priceKrw = priceKrw;
        pr.exchangeRateId = exchangeRateId;
        pr.feeAmount = feeAmount;
        pr.totalAmountKrw = totalAmountKrw;
        pr.memo = memo;
        pr.status = status != null ? status : PurchaseRequestStatus.DRAFT;
        if (shippingSnapshot != null) {
            pr.shippingUserAddressId = shippingSnapshot.getUserAddressId();
            pr.shippingLabel = shippingSnapshot.getLabel();
            pr.shippingRecipientName = shippingSnapshot.getRecipientName();
            pr.shippingRecipientPhone = shippingSnapshot.getRecipientPhone();
            pr.shippingPostalCode = shippingSnapshot.getPostalCode();
            pr.shippingAddressLine1 = shippingSnapshot.getAddressLine1();
            pr.shippingAddressLine2 = shippingSnapshot.getAddressLine2();
        }
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

    public void updateTrackingNumber(String trackingNumber) {
        if (trackingNumber != null) {
            String trimmed = trackingNumber.trim();
            this.trackingNumber = trimmed.isEmpty() ? null : trimmed;
        }
    }

    public void recordChargedAmount(BigDecimal amount) {
        this.chargedAmountKrw = amount;
    }

    public void recordSettledAmount(BigDecimal amount) {
        if (amount != null) {
            this.settledAmountKrw = amount;
        }
    }

    /** 지갑 차감·환급 한도 계산에 사용 */
    public BigDecimal resolveChargeAmountKrw() {
        if (chargedAmountKrw != null) {
            return chargedAmountKrw;
        }
        return totalAmountKrw;
    }
}
