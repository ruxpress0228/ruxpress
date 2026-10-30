-- 추천 상품(관리자 큐레이션 카탈로그) 테이블 신규 생성.
-- 이미지는 관리자 업로드 파일만 사용(image_stored_url 은 FileStoragePort 저장 경로).
-- 실행 전 백업 권장. MySQL/MariaDB 기준.

CREATE TABLE IF NOT EXISTS `products` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`admin_id`	BIGINT	NOT NULL	COMMENT '등록 관리자 ID',
	`name`	VARCHAR(200)	NOT NULL	COMMENT '상품명',
	`shop_name`	VARCHAR(100)	NOT NULL	COMMENT '판매 쇼핑몰',
	`product_url`	VARCHAR(1000)	NOT NULL	COMMENT '상품 링크',
	`price_krw`	BIGINT	NOT NULL	DEFAULT 0	COMMENT '참고 가격 (KRW)',
	`category`	VARCHAR(50)	NULL	COMMENT '카테고리',
	`description`	TEXT	NULL	COMMENT '소개',
	`image_stored_url`	VARCHAR(500)	NULL	COMMENT '대표 이미지 저장 경로',
	`image_original_filename`	VARCHAR(300)	NULL	COMMENT '대표 이미지 원본 파일명',
	`status`	ENUM('ACTIVE', 'HIDDEN')	NOT NULL	DEFAULT 'ACTIVE'	COMMENT '노출 상태',
	`is_featured`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '추천 상품',
	`sort_order`	INT	NOT NULL	DEFAULT 0	COMMENT '정렬 순서',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	PRIMARY KEY (`id`),
	KEY `idx_products_status_sort` (`status`, `is_featured`, `sort_order`)
);
