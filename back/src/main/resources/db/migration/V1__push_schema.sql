-- Push MSA local registry (no physical FK to monolith DB)
CREATE TABLE push_devices (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_push_devices_token ON push_devices (device_token);
CREATE INDEX idx_push_devices_user_active ON push_devices (user_id) WHERE is_active = TRUE;

CREATE TABLE push_delivery_attempt (
    id                   BIGSERIAL PRIMARY KEY,
    notification_id      BIGINT NOT NULL,
    user_id              BIGINT NOT NULL,
    device_token_prefix  VARCHAR(32),
    provider             VARCHAR(20) NOT NULL,
    status               VARCHAR(32) NOT NULL,
    provider_message_id  VARCHAR(200),
    error_detail         TEXT,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_delivery_notification ON push_delivery_attempt (notification_id);
