-- ============================================================================
-- RuxPress Chat DDL (MariaDB 10.6+)
-- ----------------------------------------------------------------------------
-- 실시간 상담 채팅용 스키마.
-- - chat_room: 회원과 관리자 간의 1:1 상담방. 회원당 OPEN 상태는 1개만 유지.
-- - chat_message: 메시지 로그. 방이 CLOSED가 되어도 메시지는 영구 보존.
-- PK 포맷: chat_room_id = CR + 10자리 랜덤 숫자 (VARCHAR 12)
--           chat_message_id = CM + 10자리 랜덤 숫자 (VARCHAR 12)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `chat_room` (
	`chat_room_id` VARCHAR(12)              NOT NULL                COMMENT '채팅방 ID (CR + 10자리 랜덤)',
	`user_id`      BIGINT                   NOT NULL                COMMENT '참여 회원 ID',
	`admin_id`     BIGINT                   NULL                    COMMENT '담당 관리자 ID (최초 응답 시 배정)',
	`status`       ENUM('OPEN', 'CLOSED')   NOT NULL DEFAULT 'OPEN' COMMENT '방 상태',
	`created_at`   DATETIME(6)              NOT NULL,
	`updated_at`   DATETIME(6)              NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
	PRIMARY KEY (`chat_room_id`),
	KEY `idx_chat_room_user_status`     (`user_id`, `status`),
	KEY `idx_chat_room_status_updated`  (`status`, `updated_at` DESC),
	KEY `idx_chat_room_admin_id`        (`admin_id`),
	CONSTRAINT `fk_chat_room_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`)  ON DELETE CASCADE,
	CONSTRAINT `fk_chat_room_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='고객-관리자 실시간 채팅방';

CREATE TABLE IF NOT EXISTS `chat_message` (
	`chat_message_id` VARCHAR(12)            NOT NULL                COMMENT '메시지 ID (CM + 10자리 랜덤)',
	`chat_room_id`    VARCHAR(12)            NOT NULL                COMMENT '채팅방 ID',
	`sender_id`       BIGINT                 NOT NULL                COMMENT '발신자 ID (sender_type 기준으로 users.id / admins.id)',
	`sender_type`     ENUM('USER', 'ADMIN')  NOT NULL                COMMENT '발신자 구분',
	`content`         TEXT                   NOT NULL                COMMENT '메시지 본문 (앱 단에서 최대 2000자 제한)',
	`is_read`         TINYINT(1)             NOT NULL DEFAULT 0      COMMENT '상대방 읽음 여부',
	`created_at`      DATETIME(6)            NOT NULL,
	PRIMARY KEY (`chat_message_id`),
	KEY `idx_chat_message_room_created` (`chat_room_id`, `created_at`),
	KEY `idx_chat_message_sender`       (`sender_type`, `sender_id`),
	CONSTRAINT `fk_chat_message_room` FOREIGN KEY (`chat_room_id`) REFERENCES `chat_room`(`chat_room_id`) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='채팅 메시지 로그 (종료된 방 메시지도 보존)';

-- ----------------------------------------------------------------------------
-- (옵션) 회원별 OPEN 방 유일성 보장: 유니크 인덱스.
-- 부분 인덱스는 MariaDB에서 generated column으로 우회 구현.
-- 필요 시 주석 해제.
-- ----------------------------------------------------------------------------
-- ALTER TABLE `chat_room`
--   ADD COLUMN `open_user_id` BIGINT GENERATED ALWAYS AS
--     (CASE WHEN `status` = 'OPEN' THEN `user_id` ELSE NULL END) VIRTUAL,
--   ADD UNIQUE KEY `uq_chat_room_open_per_user` (`open_user_id`);
