-- Chat message attachments (TEXT / IMAGE / FILE)
ALTER TABLE `chat_message`
  ADD COLUMN `message_type` ENUM('TEXT', 'IMAGE', 'FILE') NOT NULL DEFAULT 'TEXT' COMMENT '메시지 유형' AFTER `content`,
  ADD COLUMN `attachment_id` BIGINT NULL COMMENT 'attachments.id FK' AFTER `message_type`;
