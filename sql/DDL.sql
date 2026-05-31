-- #### mysqlsh -h aws주소 -P 3306 -u admin -p --ssl-mode=VERIFY_IDENTITY --ssl-ca=./global-bundle.pem
-- #### 초기 구축 시 실행 명령어 
CREATE DATABASE DB명
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

CREATE USER 'DB유저명'@'%' IDENTIFIED BY 'DB비밀번호';
GRANT ALL PRIVILEGES ON DB명.* TO 'ruxpDB유저명'@'%';
FLUSH PRIVILEGES;

-- #### 테이블 생성 명령어 
CREATE TABLE `inquiry_replies` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`inquiry_id`	BIGINT	NOT NULL	COMMENT '문의 ID',
	`admin_id`	BIGINT	NOT NULL	COMMENT '답변자 관리자 ID',
	`content`	TEXT	NOT NULL	COMMENT '답변 내용',
	`is_read`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '사용자 읽음 여부',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	PRIMARY KEY (`id`)
);

CREATE TABLE `user_devices` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '회원 ID',
	`device_token`	VARCHAR(500)	NOT NULL	COMMENT 'FCM 토큰',
	`device_type`	ENUM('WEB', 'ANDROID', 'IOS')	NOT NULL	DEFAULT 'WEB'	COMMENT '디바이스 유형',
	`device_name`	VARCHAR(200)	NULL	COMMENT '기기명',
	`ip_address`	VARCHAR(45)	NULL	COMMENT '마지막 로그인 IP',
	`is_active`	TINYINT(1)	NOT NULL	DEFAULT 1	COMMENT '활성 여부',
	`last_used_at`	DATETIME	NULL	COMMENT '마지막 사용 시각',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
);

CREATE TABLE `verifications` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`type`	ENUM('EMAIL', 'PHONE', 'PASSWORD_RESET')	NOT NULL	COMMENT '인증 유형',
	`target`	VARCHAR(255)	NOT NULL	COMMENT '인증 대상 (이메일 또는 전화번호)',
	`code`	VARCHAR(64)	NOT NULL	COMMENT '인증 코드 (6자리) 또는 재설정 토큰(비밀번호 재설정)',
	`is_verified`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '인증 완료 여부',
	`attempt_count`	INT	NOT NULL	DEFAULT 0	COMMENT '시도 횟수 (최대 5회)',
	`expires_at`	DATETIME	NOT NULL	COMMENT '만료 시각',
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `system_settings` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`category`	VARCHAR(50)	NOT NULL	COMMENT '설정 카테고리 (FEE, TEMPLATE, GENERAL)',
	`setting_key`	VARCHAR(100)	NOT NULL	COMMENT '설정 키',
	`setting_value`	TEXT	NOT NULL	COMMENT '설정 값 (단일 값 또는 JSON)',
	`description`	VARCHAR(300)	NULL	COMMENT '설명',
	`updated_by`	BIGINT	NULL	COMMENT '수정 관리자 ID',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
);

CREATE TABLE `purchase_requests` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '요청자 ID',
	`request_number`	VARCHAR(30)	NOT NULL	COMMENT '요청 번호',
	`request_name`	VARCHAR(300)	NOT NULL	COMMENT '요청명',
	`quantity`	INT	NOT NULL	DEFAULT 1	COMMENT '수량',
	`urls`	JSON	NULL	COMMENT '상품 URL 목록 JSON',
	`options`	JSON	NULL	COMMENT '옵션 목록 JSON (색상/사이즈 등)',
	`price_rub`	DECIMAL(18, 2)	NULL	COMMENT '상품 가격 (quote 통화 금액)',
	`quote_currency`	VARCHAR(3)	NOT NULL	DEFAULT 'RUB'	COMMENT '표시·스냅샷 기준 외화 (RUB, USD, CNY)',
	`price_krw`	DECIMAL(18, 2)	NULL	COMMENT '환산 가격 (원화)',
	`exchange_rate_id`	BIGINT	NULL	COMMENT '적용 환율 ID',
	`fee_amount`	DECIMAL(18, 2)	NULL	COMMENT '수수료',
	`total_amount_krw`	DECIMAL(18, 2)	NULL	COMMENT '총 예상 금액 (원화)',
	`charged_amount_krw`	DECIMAL(18, 2)	NULL	COMMENT '지갑 선차감',
	`settled_amount_krw`	DECIMAL(18, 2)	NULL	COMMENT '확정 실제 비용',
	`memo`	TEXT	NULL	COMMENT '특이사항 메모',
	`status`	ENUM('REQUESTED', 'PURCHASING', 'SHIPPING', 'COMPLETED', 'CANCELLED')	NOT NULL	DEFAULT 'REQUESTED'	COMMENT '상태',
	`admin_memo`	TEXT	NULL	COMMENT '관리자 내부 메모',
	`assigned_admin_id`	BIGINT	NULL	COMMENT '담당 관리자 ID',
	`tracking_number`	VARCHAR(64)	NULL	COMMENT '운송장번호 (관리자 입력)',
	`shipping_user_address_id`	BIGINT	NULL	COMMENT '선택한 회원 배송지 ID (참조)',
	`shipping_label`	VARCHAR(50)	NULL	COMMENT '배송지 라벨 스냅샷',
	`shipping_recipient_name`	VARCHAR(50)	NULL	COMMENT '수령인 스냅샷',
	`shipping_recipient_phone`	VARCHAR(20)	NULL	COMMENT '연락처 스냅샷',
	`shipping_postal_code`	VARCHAR(10)	NULL	COMMENT '우편번호 스냅샷',
	`shipping_address_line1`	VARCHAR(255)	NULL	COMMENT '주소1 스냅샷',
	`shipping_address_line2`	VARCHAR(255)	NULL	COMMENT '주소2 스냅샷',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	PRIMARY KEY (`id`)
);

CREATE TABLE `notifications` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '수신자 ID',
	`type`	ENUM('SIGNUP', 'NEW_DEVICE', 'INQUIRY_REPLY', 'NOTICE', 'PROMOTION', 'PURCHASE_STATUS', 'BALANCE', 'BANK_DEPOSIT', 'CHAT')	NOT NULL	COMMENT '알림 유형',
	`channel`	ENUM('PUSH', 'SMS', 'EMAIL')	NOT NULL	DEFAULT 'PUSH'	COMMENT '발송 채널',
	`title`	VARCHAR(200)	NOT NULL	COMMENT '제목',
	`body`	TEXT	NOT NULL	COMMENT '본문',
	`data_json`	JSON	NULL	COMMENT '추가 데이터 (딥링크 등)',
	`is_read`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '읽음',
	`send_status`	ENUM('PENDING', 'SENT', 'FAILED')	NOT NULL	DEFAULT 'PENDING'	COMMENT '발송 상태',
	`sent_at`	DATETIME	NULL	COMMENT '발송 시각',
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `users` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT '회원 고유 ID',
	`email`	VARCHAR(255)	NOT NULL	COMMENT '이메일 (로그인 ID)',
	`password_hash`	VARCHAR(255)	NULL	COMMENT '비밀번호 해시 (BCrypt), SNS전용 NULL',
	`phone`	VARCHAR(20)	NULL	COMMENT '휴대폰 번호 (E.164)',
	`nickname`	VARCHAR(50)	NOT NULL	COMMENT '닉네임',
	`profile_image_url`	VARCHAR(500)	NULL	COMMENT '프로필 이미지 (S3)',
	`status`	ENUM('ACTIVE', 'SUSPENDED', 'WITHDRAWN')	NOT NULL	DEFAULT 'ACTIVE'	COMMENT '회원 상태',
	`email_verified`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '이메일 인증 완료',
	`phone_verified`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '휴대폰 인증 완료',
	`signup_type`	ENUM('EMAIL', 'PHONE', 'GOOGLE')	NOT NULL	DEFAULT 'EMAIL'	COMMENT '가입 유형',
	`timezone`	VARCHAR(50)	NOT NULL	DEFAULT 'Asia/Seoul'	COMMENT '사용자 타임존',
	`notification_settings`	JSON	NULL	COMMENT '알림 수신 설정 JSON',
	`last_login_at`	DATETIME	NULL	COMMENT '마지막 로그인 (UTC)',
	`withdrawn_at`	DATETIME	NULL	COMMENT '탈퇴 일시',
	`created_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP	COMMENT '가입 일시',
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	`address_postal_code` VARCHAR(10) NULL COMMENT '우편번호 (기본 배송지 캐시)',
	`address_line1` VARCHAR(255) NULL COMMENT '기본 주소 (기본 배송지 캐시)',
	`address_line2` VARCHAR(255) NULL COMMENT '상세 주소 (기본 배송지 캐시)',
	PRIMARY KEY (`id`)
);

CREATE TABLE `user_addresses` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT '배송지 고유 ID',
	`user_id`	BIGINT	NOT NULL	COMMENT '회원 ID',
	`label`	VARCHAR(50)	NULL	COMMENT '배송지 별칭 (예: 집, 회사)',
	`recipient_name`	VARCHAR(50)	NULL	COMMENT '수령인 이름',
	`recipient_phone`	VARCHAR(20)	NULL	COMMENT '수령인 연락처',
	`postal_code`	VARCHAR(10)	NULL	COMMENT '우편번호',
	`address_line1`	VARCHAR(255)	NOT NULL	COMMENT '기본 주소',
	`address_line2`	VARCHAR(255)	NULL	COMMENT '상세 주소',
	`is_default`	TINYINT(1)	NOT NULL DEFAULT 0	COMMENT '기본 배송지 여부 (회원당 1건)',
	`created_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	KEY `idx_user_addresses_user` (`user_id`),
	CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `notices` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`admin_id`	BIGINT	NOT NULL	COMMENT '작성자 관리자 ID',
	`title`	VARCHAR(300)	NOT NULL	COMMENT '제목',
	`content`	TEXT	NOT NULL	COMMENT '내용 (HTML)',
	`is_pinned`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '상단 고정',
	`view_count`	INT	NOT NULL	DEFAULT 0	COMMENT '조회수',
	`status`	ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'HIDDEN')	NOT NULL	DEFAULT 'DRAFT'	COMMENT '상태',
	`published_at`	DATETIME	NULL	COMMENT '발행/예약 일시',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	PRIMARY KEY (`id`)
);

CREATE TABLE `inquiries` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '작성자 ID',
	`category`	ENUM('ORDER', 'SHIPPING', 'PAYMENT', 'ETC')	NOT NULL	DEFAULT 'ETC'	COMMENT '카테고리',
	`title`	VARCHAR(200)	NOT NULL	COMMENT '제목',
	`content`	TEXT	NOT NULL	COMMENT '내용',
	`status`	ENUM('PENDING', 'REPLIED', 'CLOSED')	NOT NULL	DEFAULT 'PENDING'	COMMENT '상태',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	PRIMARY KEY (`id`)
);

CREATE TABLE `admins` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT	COMMENT '관리자 고유 ID',
	`email`	VARCHAR(255)	NOT NULL	COMMENT '관리자 이메일',
	`password_hash`	VARCHAR(255)	NOT NULL	COMMENT '비밀번호 해시',
	`name`	VARCHAR(50)	NOT NULL	COMMENT '이름',
	`phone`	VARCHAR(20)	NULL	COMMENT '연락처',
	`role`	ENUM('SUPER_ADMIN', 'COUNSELOR')	NOT NULL	DEFAULT 'COUNSELOR'	COMMENT '역할 (SUPER_ADMIN=전체권한, COUNSELOR=문의답변만)',
	`status`	ENUM('ACTIVE', 'INACTIVE')	NOT NULL	DEFAULT 'ACTIVE'	COMMENT '상태',
	`last_login_at`	DATETIME	NULL	COMMENT '마지막 로그인',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	PRIMARY KEY (`id`)
);

CREATE TABLE `user_social_accounts` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '회원 ID',
	`provider`	ENUM('GOOGLE')	NOT NULL	COMMENT '소셜 제공자',
	`provider_user_id`	VARCHAR(255)	NOT NULL	COMMENT '소셜 고유 ID',
	`provider_email`	VARCHAR(255)	NULL	COMMENT '소셜 이메일',
	`access_token`	VARCHAR(1000)	NULL	COMMENT 'OAuth Access Token (암호화)',
	`refresh_token`	VARCHAR(1000)	NULL	COMMENT 'OAuth Refresh Token (암호화)',
	`token_expires_at`	DATETIME	NULL	COMMENT '토큰 만료 시각',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
);

CREATE TABLE `attachments` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`ref_type`	ENUM('PURCHASE', 'INQUIRY', 'REVIEW', 'CHAT', 'BANK_TRANSFER', 'BANK_TRANSFER_NOTICE')	NOT NULL	COMMENT '참조 대상 유형',
	`ref_id`	BIGINT	NOT NULL	COMMENT '참조 대상 ID',
	`original_filename`	VARCHAR(300)	NOT NULL	COMMENT '원본 파일명',
	`stored_url`	VARCHAR(500)	NOT NULL	COMMENT 'S3 저장 URL',
	`thumbnail_url`	VARCHAR(500)	NULL	COMMENT '썸네일 URL',
	`file_size`	INT	NOT NULL	COMMENT '파일 크기 (bytes)',
	`mime_type`	VARCHAR(100)	NOT NULL	COMMENT 'MIME 타입',
	`sort_order`	INT	NOT NULL	DEFAULT 0	COMMENT '정렬 순서',
	`uploaded_by_admin`	TINYINT(1)	NULL	COMMENT '관리자 업로드 여부 (NULL/0=사용자, 1=관리자)',
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `exchange_rates` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`base_currency`	VARCHAR(3)	NOT NULL	DEFAULT 'RUB'	COMMENT '기준 통화',
	`target_currency`	VARCHAR(3)	NOT NULL	DEFAULT 'KRW'	COMMENT '대상 통화',
	`rate`	DECIMAL(18, 6)	NOT NULL	COMMENT '환율 (1 base_currency = ? KRW)',
	`source`	ENUM('API', 'MANUAL')	NOT NULL	DEFAULT 'API'	COMMENT '출처',
	`admin_id`	BIGINT	NULL	COMMENT '수동 입력 시 관리자 ID',
	`is_current`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '현재 적용 환율',
	`fetched_at`	DATETIME	NOT NULL	COMMENT '조회/입력 시각',
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`),
	KEY `IX_EXCHANGE_RATES_BASE_CURRENT` (`base_currency`, `is_current`)
);

-- REQ-017: 입금 계좌 (관리자 등록)
CREATE TABLE `settlement_accounts` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`bank_name`	VARCHAR(100)	NOT NULL	COMMENT '은행명',
	`account_number`	VARCHAR(50)	NOT NULL	COMMENT '계좌번호 (평문 저장 금지 권장 — 앱 레벨 암호화)',
	`account_holder`	VARCHAR(100)	NOT NULL	COMMENT '예금주',
	`display_memo`	VARCHAR(300)	NULL	COMMENT '안내 메모',
	`active`	TINYINT(1)	NOT NULL	DEFAULT 1	COMMENT '노출/사용 여부',
	`created_by_admin_id`	BIGINT	NULL	COMMENT '등록 관리자',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	PRIMARY KEY (`id`)
);

-- REQ-017: 이체 원장 (ref_type/ref_id로 purchase_requests 등 후속 연결)
CREATE TABLE `transfer_ledger_entries` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '회원 ID',
	`settlement_account_id`	BIGINT	NOT NULL	COMMENT '입금 대상 계좌',
	`entry_type`	ENUM('DEPOSIT', 'SETTLEMENT', 'REFUND')	NOT NULL	COMMENT '원장 유형',
	`status`	ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED')	NOT NULL	DEFAULT 'PENDING',
	`amount`	DECIMAL(18, 2)	NOT NULL	COMMENT '금액',
	`currency`	VARCHAR(3)	NOT NULL	DEFAULT 'KRW',
	`depositor_name`	VARCHAR(100)	NULL	COMMENT '입금자명 (매칭용)',
	`depositor_memo`	VARCHAR(500)	NULL	COMMENT '사용자 입금 메모',
	`admin_memo`	VARCHAR(500)	NULL	COMMENT '관리자 메모',
	`ref_type`	VARCHAR(50)	NULL	COMMENT '참조 도메인 (예: PURCHASE_REQUEST)',
	`ref_id`	BIGINT	NULL	COMMENT '참조 ID',
	`parent_entry_id`	BIGINT	NULL	COMMENT '부모 입금 원장 ID — 정산/환불 행이 가리킴',
	`confirmed_at`	DATETIME	NULL,
	`confirmed_by_admin_id`	BIGINT	NULL,
	`idempotency_key`	VARCHAR(100)	NULL	COMMENT 'PG/웹훅 멱등 키',
	`version`	INT	NOT NULL	DEFAULT 0	COMMENT '낙관적 락',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제 (BaseEntity / Hibernate validate)',
	PRIMARY KEY (`id`),
	KEY `IX_TRANSFER_LEDGER_USER` (`user_id`),
	KEY `IX_TRANSFER_LEDGER_STATUS` (`status`),
	KEY `IX_TRANSFER_LEDGER_PARENT` (`parent_entry_id`),
	KEY `IX_TRANSFER_LEDGER_REF` (`ref_type`, `ref_id`),
	UNIQUE KEY `UK_TRANSFER_IDEMPOTENCY` (`idempotency_key`)
);

-- REQ-016: 지갑·원장 
CREATE TABLE IF NOT EXISTS `user_wallets` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '회원 ID',
	`balance`	DECIMAL(18, 2)	NOT NULL	DEFAULT 0	COMMENT '가용 잔액 (KRW)',
	`version`	INT	NOT NULL	DEFAULT 0	COMMENT '낙관적 락',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE KEY `UK_USER_WALLET_USER` (`user_id`)
);

CREATE TABLE `chat_room` (
	`chat_room_id`	VARCHAR(12)	NOT NULL	COMMENT '채팅방 ID (CR + 10자리 랜덤)',
	`user_id`	BIGINT	NOT NULL	COMMENT '참여 회원 ID',
	`admin_id`	BIGINT	NULL	COMMENT '담당 관리자 ID (최초 응답 시 배정)',
	`status`	ENUM('OPEN', 'CLOSED')	NOT NULL	DEFAULT 'OPEN'	COMMENT '방 상태',
	`created_at`	DATETIME(6)	NOT NULL,
	`updated_at`	DATETIME(6)	NOT NULL	DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
	PRIMARY KEY (`chat_room_id`),
	KEY `idx_chat_room_user_status` (`user_id`, `status`),
	KEY `idx_chat_room_status_updated` (`status`, `updated_at` DESC),
	KEY `idx_chat_room_admin_id` (`admin_id`),
	CONSTRAINT `fk_chat_room_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_chat_room_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='고객-관리자 실시간 채팅방';

CREATE TABLE `chat_message` (
	`chat_message_id`	VARCHAR(12)	NOT NULL	COMMENT '메시지 ID (CM + 10자리 랜덤)',
	`chat_room_id`	VARCHAR(12)	NOT NULL	COMMENT '채팅방 ID',
	`sender_id`	BIGINT	NOT NULL	COMMENT '발신자 ID (users.id 또는 admins.id — sender_type으로 구분)',
	`sender_type`	ENUM('USER', 'ADMIN')	NOT NULL	COMMENT '발신자 구분',
	`content`	TEXT	NOT NULL	COMMENT '메시지 본문 (최대 2000자)',
	`is_read`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '상대방 읽음 여부',
	`created_at`	DATETIME(6)	NOT NULL,
	PRIMARY KEY (`chat_message_id`),
	KEY `idx_chat_message_room_created` (`chat_room_id`, `created_at`),
	KEY `idx_chat_message_sender` (`sender_type`, `sender_id`),
	CONSTRAINT `fk_chat_message_room` FOREIGN KEY (`chat_room_id`) REFERENCES `chat_room`(`chat_room_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채팅 메시지 저장 (종료된 방의 메시지도 보존됨)';

CREATE TABLE IF NOT EXISTS `wallet_ledger_entries` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '회원 ID',
	`entry_type`	ENUM('CREDIT_BANK_DEPOSIT','CREDIT_CARD','CREDIT_PURCHASE_REFUND','CREDIT_PURCHASE_ADJUSTMENT','DEBIT_PURCHASE','DEBIT_BANK_REFUND','CREDIT_ADMIN_ADJUSTMENT','DEBIT_ADMIN_ADJUSTMENT')	NOT NULL	COMMENT '원장 유형',
	`amount`	DECIMAL(18, 2)	NOT NULL	COMMENT '금액 (양수)',
	`currency`	VARCHAR(3)	NOT NULL	DEFAULT 'KRW',
	`idempotency_key`	VARCHAR(100)	NOT NULL	COMMENT '멱등 키',
	`transfer_ledger_entry_id`	BIGINT	NULL,
	`purchase_request_id`	BIGINT	NULL,
	`transfer_refund_entry_id`	BIGINT	NULL,
	`memo`	VARCHAR(500)	NULL,
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `UK_WALLET_LEDGER_IDEM` (`idempotency_key`),
	KEY `IX_WALLET_LEDGER_USER` (`user_id`)
);

CREATE TABLE `admin_notifications` (
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
