-- 구매요청 상태 단순화: 기존 ENUM 값 → REQUESTED, PURCHASING, SHIPPING, COMPLETED, CANCELLED
-- 실행 전 백업 권장. MySQL/MariaDB 기준.

-- 1) 새·구 값을 모두 담을 수 있도록 컬럼 확장
ALTER TABLE `purchase_requests`
  MODIFY COLUMN `status` ENUM(
    'DRAFT', 'SUBMITTED', 'REVIEWING', 'CONFIRMED',
    'PURCHASING', 'PURCHASED', 'SHIPPING', 'DELIVERED',
    'CANCELLED', 'REFUNDED',
    'REQUESTED', 'COMPLETED'
  ) NOT NULL DEFAULT 'DRAFT';

-- 2) 데이터 매핑
UPDATE `purchase_requests` SET `status` = 'REQUESTED'
  WHERE `status` IN ('DRAFT', 'SUBMITTED', 'REVIEWING', 'CONFIRMED');

UPDATE `purchase_requests` SET `status` = 'SHIPPING'
  WHERE `status` IN ('PURCHASED', 'SHIPPING');

UPDATE `purchase_requests` SET `status` = 'COMPLETED'
  WHERE `status` = 'DELIVERED';

UPDATE `purchase_requests` SET `status` = 'CANCELLED'
  WHERE `status` IN ('CANCELLED', 'REFUNDED');

-- 3) 최종 ENUM으로 축소
ALTER TABLE `purchase_requests`
  MODIFY COLUMN `status` ENUM('REQUESTED', 'PURCHASING', 'SHIPPING', 'COMPLETED', 'CANCELLED')
  NOT NULL DEFAULT 'REQUESTED' COMMENT '상태';
