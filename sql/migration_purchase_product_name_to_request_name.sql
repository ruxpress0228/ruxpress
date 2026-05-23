-- 구매 요청: product_name → request_name (엔티티 필드 requestName 과 일치)
ALTER TABLE `purchase_requests`
    CHANGE COLUMN `product_name` `request_name` VARCHAR(300) NOT NULL COMMENT '요청명';
