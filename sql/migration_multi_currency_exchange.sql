-- 다통화 환율: purchase_requests.quote_currency
ALTER TABLE `purchase_requests`
    ADD COLUMN IF NOT EXISTS `quote_currency` VARCHAR(3) NOT NULL DEFAULT 'RUB'
        COMMENT '표시·스냅샷 기준 외화 (RUB, USD, CNY)' AFTER `price_rub`;

-- exchange_rates: 통화별 current 조회용 (MariaDB 10.5+ IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS `IX_EXCHANGE_RATES_BASE_CURRENT` ON `exchange_rates` (`base_currency`, `is_current`);
