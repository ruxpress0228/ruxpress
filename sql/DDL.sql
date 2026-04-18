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
	`product_name`	VARCHAR(300)	NOT NULL	COMMENT '상품명',
	`quantity`	INT	NOT NULL	DEFAULT 1	COMMENT '수량',
	`urls`	JSON	NULL	COMMENT '상품 URL 목록 JSON',
	`options`	JSON	NULL	COMMENT '옵션 목록 JSON (색상/사이즈 등)',
	`price_rub`	DECIMAL(18, 2)	NULL	COMMENT '상품 가격 (루블)',
	`price_krw`	DECIMAL(18, 2)	NULL	COMMENT '환산 가격 (원화)',
	`exchange_rate_id`	BIGINT	NULL	COMMENT '적용 환율 ID',
	`fee_amount`	DECIMAL(18, 2)	NULL	COMMENT '수수료',
	`total_amount_krw`	DECIMAL(18, 2)	NULL	COMMENT '총 예상 금액 (원화)',
	`memo`	TEXT	NULL	COMMENT '특이사항 메모',
	`status`	ENUM('DRAFT', 'SUBMITTED', 'REVIEWING', 'CONFIRMED', 'PURCHASING', 'PURCHASED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED')	NOT NULL	DEFAULT 'DRAFT'	COMMENT '상태',
	`admin_memo`	TEXT	NULL	COMMENT '관리자 내부 메모',
	`assigned_admin_id`	BIGINT	NULL	COMMENT '담당 관리자 ID',
	`created_at`	DATETIME	NOT NULL,
	`updated_at`	DATETIME	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`deleted_at`	DATETIME	NULL	COMMENT '소프트 삭제',
	PRIMARY KEY (`id`)
);

CREATE TABLE `notifications` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '수신자 ID',
	`type`	ENUM('SIGNUP', 'NEW_DEVICE', 'INQUIRY_REPLY', 'NOTICE', 'PROMOTION', 'PURCHASE_STATUS', 'BALANCE', 'BANK_DEPOSIT', 'ESCROW_STATUS')	NOT NULL	COMMENT '알림 유형',
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
	`address_postal_code` VARCHAR(10) NULL COMMENT '우편번호',
	`address_line1` VARCHAR(255) NULL COMMENT '기본 주소',
	`address_line2` VARCHAR(255) NULL COMMENT '상세 주소',
	PRIMARY KEY (`id`)
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
	`ref_type`	ENUM('PURCHASE', 'INQUIRY', 'REVIEW', 'CHAT')	NOT NULL	COMMENT '참조 대상 유형',
	`ref_id`	BIGINT	NOT NULL	COMMENT '참조 대상 ID',
	`original_filename`	VARCHAR(300)	NOT NULL	COMMENT '원본 파일명',
	`stored_url`	VARCHAR(500)	NOT NULL	COMMENT 'S3 저장 URL',
	`thumbnail_url`	VARCHAR(500)	NULL	COMMENT '썸네일 URL',
	`file_size`	INT	NOT NULL	COMMENT '파일 크기 (bytes)',
	`mime_type`	VARCHAR(100)	NOT NULL	COMMENT 'MIME 타입',
	`sort_order`	INT	NOT NULL	DEFAULT 0	COMMENT '정렬 순서',
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`)
);

CREATE TABLE `exchange_rates` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`base_currency`	VARCHAR(3)	NOT NULL	DEFAULT 'RUB'	COMMENT '기준 통화',
	`target_currency`	VARCHAR(3)	NOT NULL	DEFAULT 'KRW'	COMMENT '대상 통화',
	`rate`	DECIMAL(18, 6)	NOT NULL	COMMENT '환율 (1 RUB = ? KRW)',
	`source`	ENUM('API', 'MANUAL')	NOT NULL	DEFAULT 'API'	COMMENT '출처',
	`admin_id`	BIGINT	NULL	COMMENT '수동 입력 시 관리자 ID',
	`is_current`	TINYINT(1)	NOT NULL	DEFAULT 0	COMMENT '현재 적용 환율',
	`fetched_at`	DATETIME	NOT NULL	COMMENT '조회/입력 시각',
	`created_at`	DATETIME	NOT NULL,
	PRIMARY KEY (`id`)
);

-- REQ-017: 정산(에스크로) 입금 계좌 (관리자 등록)
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

-- REQ-017: 이체·에스크로 공통 원장 (ref_type/ref_id로 purchase_requests 등 후속 연결)
CREATE TABLE `transfer_ledger_entries` (
	`id`	BIGINT	NOT NULL AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	COMMENT '회원 ID',
	`settlement_account_id`	BIGINT	NOT NULL	COMMENT '입금 대상 계좌',
	`entry_type`	ENUM('DEPOSIT', 'ESCROW_HOLD', 'SETTLEMENT', 'REFUND')	NOT NULL	COMMENT '원장 유형',
	`status`	ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED')	NOT NULL	DEFAULT 'PENDING',
	`amount`	DECIMAL(18, 2)	NOT NULL	COMMENT '금액',
	`currency`	VARCHAR(3)	NOT NULL	DEFAULT 'KRW',
	`depositor_name`	VARCHAR(100)	NULL	COMMENT '입금자명 (매칭용)',
	`depositor_memo`	VARCHAR(500)	NULL	COMMENT '사용자 입금 메모',
	`admin_memo`	VARCHAR(500)	NULL	COMMENT '관리자 메모',
	`ref_type`	VARCHAR(50)	NULL	COMMENT '참조 도메인 (예: PURCHASE_REQUEST)',
	`ref_id`	BIGINT	NULL	COMMENT '참조 ID',
	`parent_entry_id`	BIGINT	NULL	COMMENT '에스크로 본건(ID) — 정산/환불 행이 가리킴',
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