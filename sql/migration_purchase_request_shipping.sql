-- 구매 요청에 배송지 스냅샷 컬럼 추가 (기존 DB 마이그레이션)
ALTER TABLE `purchase_requests`
	ADD COLUMN `shipping_user_address_id` BIGINT NULL COMMENT '선택한 회원 배송지 ID (참조)' AFTER `tracking_number`,
	ADD COLUMN `shipping_label` VARCHAR(50) NULL COMMENT '배송지 라벨 스냅샷' AFTER `shipping_user_address_id`,
	ADD COLUMN `shipping_recipient_name` VARCHAR(50) NULL COMMENT '수령인 스냅샷' AFTER `shipping_label`,
	ADD COLUMN `shipping_recipient_phone` VARCHAR(20) NULL COMMENT '연락처 스냅샷' AFTER `shipping_recipient_name`,
	ADD COLUMN `shipping_postal_code` VARCHAR(10) NULL COMMENT '우편번호 스냅샷' AFTER `shipping_recipient_phone`,
	ADD COLUMN `shipping_address_line1` VARCHAR(255) NULL COMMENT '주소1 스냅샷' AFTER `shipping_postal_code`,
	ADD COLUMN `shipping_address_line2` VARCHAR(255) NULL COMMENT '주소2 스냅샷' AFTER `shipping_address_line1`;
