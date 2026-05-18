# Kafka 계약 (ruxpress ↔ mobile-push)

ENUM·길이는 모노리스 [DDL.sql](../../sql/DDL.sql) 기준입니다.

## 토픽

| 토픽 | 방향 | 설명 |
|------|------|------|
| `ruxpress.notification.push.dispatch` | 모노리스 → 푸시 | 푸시 발송 요청 |
| `ruxpress.user.device.sync` | 모노리스 → 푸시 | 디바이스 토큰 동기화 |
| `ruxpress.notification.push.result` | 푸시 → 모노리스 | 발송 집계 결과 (선택) |
| `ruxpress.notification.push.dispatch.dlq` | 푸시 | dispatch 처리 실패 |
| `ruxpress.user.device.sync.dlq` | 푸시 | device-sync 처리 실패 |

MVP는 **JSON 문자열** 메시지 본문입니다.

---

## `ruxpress.notification.push.dispatch`

| 필드 | 타입 | 설명 |
|------|------|------|
| `eventId` | string (UUID) | 멱등·중복 처리용 |
| `notificationId` | number | `notifications.id` |
| `userId` | number | `notifications.user_id` |
| `type` | string | DDL `notifications.type`: `SIGNUP`, `NEW_DEVICE`, `INQUIRY_REPLY`, `NOTICE`, `PROMOTION`, `PURCHASE_STATUS`, `BALANCE` |
| `title` | string | 최대 200자 |
| `body` | string | 본문 |
| `dataJson` | object 또는 string \| null | DDL `data_json`와 동일 의미 |
| `createdAt` | string | ISO-8601 (UTC 권장) |

**파티션 키:** 모노리스 outbox에서 `userId` 문자열 사용 (팀 합의로 `notificationId`도 가능).

**소비:** `userId` 기준으로 푸시 MSA `push_devices`에서 `is_active`이고 `device_type` ∈ `ANDROID`,`IOS` 인 행에 멀티캐스트.

---

## `ruxpress.user.device.sync`

| 필드 | 타입 | 설명 |
|------|------|------|
| `eventId` | string (UUID) | 멱등용 |
| `userId` | number | `user_devices.user_id` |
| `deviceToken` | string | 최대 500자 |
| `deviceType` | string | DDL `user_devices.device_type`: `WEB`, `ANDROID`, `IOS` |
| `isActive` | boolean | 활성 여부 |
| `lastUsedAt` | string \| null | ISO-8601 |
| `operation` | string | MVP는 `UPSERT` |

**소비:** `WEB`은 푸시 레지스트리에 넣지 않거나 무시. `ANDROID`/`IOS`만 `push_devices` upsert.

---

## `ruxpress.notification.push.result`

푸시 MSA가 발행하는 JSON 예시 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `eventId` | string | UUID |
| `notificationId` | number | 논리 FK → `notifications.id` |
| `aggregateStatus` | string | `SENT` 또는 `FAILED` (부분 성공 시 정책에 따라 `SENT` 등) |
| `sentAt` | string \| null | `Instant` 문자열 등 ISO-8601 |
| `failureReason` | string \| null | 짧은 코드/메시지 |

모노리스 컨슈머는 `PENDING`인 행에 대해 `send_status`·`sent_at`을 갱신합니다.

---

## DDL 참고

- `notifications`: L69–81 — `type`, `channel`, `send_status`, `title`(200), `body`, `data_json`
- `user_devices`: L11–23 — `device_token`(500), `device_type` ENUM
- `outbox_events`: 모노리스 DDL — 트랜잭션 아웃박스용
