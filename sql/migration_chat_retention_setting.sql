-- Default chat message retention: PERMANENT (no automatic deletion)
INSERT INTO system_settings (category, setting_key, setting_value, description, created_at, updated_at)
SELECT 'CHAT', 'chat_message_retention', 'PERMANENT', '채팅 메시지 보존 기간', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings WHERE setting_key = 'chat_message_retention'
);
