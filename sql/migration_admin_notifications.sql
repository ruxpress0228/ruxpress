-- 관리자 알림(in-app) 테이블 신규 생성. 기존 notifications 테이블과 완전 분리됨.
-- 수신자별 fan-out on write 방식: 이벤트 1건 당 활성 관리자 수만큼 row 생성.
-- 실행 전 백업 권장. MySQL/MariaDB 기준.

CREATE TABLE IF NOT EXISTS `admin_notifications` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`admin_id`	BIGINT	NOT NULL	COMMENT '수신 관리자 ID',
	`type`	ENUM('NEW_PURCHASE_REQUEST', 'NEW_DEPOSIT_REPORT', 'NEW_INQUIRY')	NOT NULL	COMMENT '알림 유형',
	`title`	VARCHAR(200)	NOT NULL	COMMENT '제목',
	`body`	TEXT	NOT NULL	COMMENT '본문',
	`data_json`	JSON	NULL	COMMENT '추가 데이터 (연관 리소스 ID 등)',
	`link_url`	VARCHAR(500)	NULL	COMMENT '클릭 시 이동할 관리자 페이지 URL',
	`is_read`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '읽음 여부',
	`read_at`	DATETIME	NULL	COMMENT '읽음 시각',
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`),
	KEY `idx_admin_notif_admin_created` (`admin_id`, `created_at`),
	KEY `idx_admin_notif_admin_read` (`admin_id`, `is_read`)
);
