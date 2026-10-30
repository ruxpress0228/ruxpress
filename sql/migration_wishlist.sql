-- 상품 카탈로그 v2: products.view_count(조회수) 컬럼 추가 + 회원 찜 목록(product_wishlists) 테이블 신규 생성.
-- products 테이블이 이미 있는 DB 용. 신규 구축은 DDL.sql(또는 migration_products.sql) 에 이미 포함되어 있다.
-- 실행 전 백업 권장. MariaDB 기준 — MySQL 은 ADD COLUMN 의 IF NOT EXISTS 를 지원하지 않으므로 그 구절을 빼고 실행한다.

ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `view_count` BIGINT NOT NULL DEFAULT 0 COMMENT '조회수' AFTER `sort_order`;

CREATE TABLE IF NOT EXISTS `product_wishlists` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '회원 ID',
	`product_id`	BIGINT	NOT NULL	COMMENT '상품 ID',
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `uk_product_wishlists_user_product` (`user_id`, `product_id`),
	KEY `idx_product_wishlists_user` (`user_id`)
);
