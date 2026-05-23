-- notifications.type ENUM에 CHAT 추가 (채팅 푸시 알림용)
ALTER TABLE `notifications`
  MODIFY COLUMN `type` ENUM(
    'SIGNUP',
    'NEW_DEVICE',
    'INQUIRY_REPLY',
    'NOTICE',
    'PROMOTION',
    'PURCHASE_STATUS',
    'BALANCE',
    'BANK_DEPOSIT',
    'CHAT'
  ) NOT NULL COMMENT '알림 유형';
