package com.ruxpress.domain.exchange.entity;

import com.ruxpress.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_rate")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ExchangeRate extends BaseEntity {

    @Column(nullable = false, length = 3)
    private String baseCurrency;

    @Column(nullable = false, length = 3)
    private String targetCurrency;

    @Column(nullable = false, precision = 10, scale = 6)
    private BigDecimal rate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ExchangeRateSource source;

    @Column(name = "admin_id")
    private Long adminId;

    @Column(nullable = false)
    private Boolean isCurrent;

    public void setCurrent(Boolean current) {
        this.isCurrent = current;
    }

    @Column(nullable = false)
    private LocalDateTime fetchedAt;
}
