# ruxpress-mobile-push

모바일 푸시 전용 마이크로서비스입니다. **ruxpress** 저장소의 `mobilePush/` 디렉터리에 있습니다. 모노리스 백엔드(`back/`)는 **Kafka**로 `dispatch` / `device.sync` 이벤트를 보내고, 이 서비스가 **FCM**으로 전송합니다. 알림 원장(`notifications`)은 모노리스 DB에만 있습니다.

빌드·실행 시 저장소 루트가 아니라 **이 디렉터리**에서 Maven을 실행합니다 (`cd mobilePush`).

## 요구 사항

- JDK 21
- Maven 3.9+
- Docker (선택: `local` 프로필 + Kafka·Postgres 통합 테스트 시)

## 로컬 인프라 (Docker 사용 시)

```bash
cd mobilePush
docker compose up -d
```

- Kafka: `localhost:9092`
- PostgreSQL: `localhost:5433`, DB `ruxpress_push`, 사용자/비밀번호 `push`

## Docker 없이 로컬만으로 실행

지금은 **Kafka / Postgres 컨테이너 없이**도 Postman + FCM 테스트가 가능합니다.

```bash
cd mobilePush
mvn spring-boot:run -Dspring-boot.run.profiles=no-docker
```

호스트에 Kafka(ZooKeeper)를 띄운 뒤 **소비·토픽 자동 생성**까지 쓰려면:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=no-docker,local-kafka
```

- **DB:** 메모리 **H2** (`ddl-auto: create-drop`), Flyway 끔  
- **Kafka:** `no-docker`만 쓰면 컨슈머 **자동 기동 끔** — 브로커가 없어도 앱이 뜸. `no-docker,local-kafka`면 리스너·토픽 Admin·Actuator Kafka health 켜짐.  
- **토픽 자동 생성 빈:** `no-docker`만이면 비활성; `local-kafka` 포함 시 활성 (`KafkaTopicConfig`)  
- **`push.result` / DLQ** 는 브로커가 없으면 전송이 실패하지만 **로그만 남기고**, `/internal/dev/*` 로 FCM까지는 호출 가능  

로컬 **단계 1~4** 검증: ZooKeeper·Kafka·본 서비스는 [`docs/mobile-push-local-kafka-test.md`](../docs/mobile-push-local-kafka-test.md), nginx·모노리스·에뮬레이터 **E2E 런북**은 [`docs/local-push-e2e.md`](../docs/local-push-e2e.md) 를 참고하세요.

이후 Docker를 쓰게 되면 `local` 프로필 + `docker compose` 로 전환하면 됩니다.

## FCM: Android 앱 vs 이 서버

| 구분 | 사용하는 것 |
|------|-------------|
| **Android 앱** | 루트의 `google-services.json`, Gradle `com.google.gms.google-services`, `firebase-bom` (예: 34.11.0), `implementation("com.google.firebase:firebase-messaging")` 등 |
| **이 서버 (Admin SDK)** | Firebase Console → 프로젝트 설정 → **서비스 계정** → 새 비밀 키 JSON. **`google-services.json`은 클라이언트용이라 서버에 넣어도 Admin 초기화에 쓰이지 않습니다.** |

기본 설정은 앱 `google-services.json`과 동일한 **`project_id` / `package_name`** 을 맞춰 두었습니다 (`ruxpress-ff3b3`, `com.ruxpress.android`). 전송 시 Android 쪽은 `HIGH` 우선순위 + (설정 시) **restricted package** 로 해당 패키지로만 가도록 제한합니다.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka 브로커 (기본 `localhost:9092`) |
| `SPRING_DATASOURCE_URL` | JDBC URL (기본은 `application-local.yml` 참고) |
| `FCM_ENABLED` | `true`일 때만 Firebase 초기화 |
| `FCM_PROJECT_ID` | GCP/Firebase 프로젝트 ID (기본 `ruxpress-ff3b3`) |
| `FCM_ANDROID_PACKAGE` | Android 앱 패키지 (기본 `com.ruxpress.android`) |
| `FCM_CREDENTIALS_PATH` | 서비스 계정 JSON 파일 경로 (`credentials-json` 보다 우선하지 않음 — 둘 중 하나 또는 `GOOGLE_APPLICATION_CREDENTIALS`) |
| `FCM_CREDENTIALS_JSON` | 서비스 계정 JSON 전체를 한 줄/환경에 넣을 때 (로컬·CI용, 운영은 파일/시크릿 권장) |
| `GOOGLE_APPLICATION_CREDENTIALS` | 서비스 계정 JSON 파일 경로 (표준 GCP 방식) |

## 실행

**Docker 없이 (Postman·FCM만):**

```bash
cd mobilePush
mvn spring-boot:run -Dspring-boot.run.profiles=no-docker
```

**Docker + Postgres + Kafka (`local`):**

```bash
cd mobilePush
docker compose up -d
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

앱 포트: **8081**

## Postman으로 로컬 테스트

이 서비스는 기본적으로 **Kafka 소비**로만 동작합니다. Postman으로 빠르게 보려면 **`local` 또는 `no-docker` 프로필**에서 켜지는 개발용 HTTP API를 쓰면 됩니다.

### 0) 준비

1. 기동: **`no-docker` 프로필**이면 Docker 불필요. (`local` 프로필이면 `docker compose up -d` 권장)
2. `FCM_ENABLED=true` 및 서비스 계정 JSON 경로/내용 설정 (실제 기기 수신 테스트 시)
3. 앱에서 받은 **실제 FCM 등록 토큰** 준비

### 1) 헬스 (선택)

- `GET` `http://localhost:8081/actuator/health`

### 2) 디바이스 등록 (`push_devices`에 토큰 넣기)

`POST` `http://localhost:8081/internal/dev/device-sync`  
Headers: `Content-Type: application/json`

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 1,
  "deviceToken": "<앱에서_복사한_FCM_토큰>",
  "deviceType": "ANDROID",
  "isActive": true,
  "lastUsedAt": null,
  "operation": "UPSERT"
}
```

### 3) 푸시 발송 시뮬레이션 (Kafka 생략)

`POST` `http://localhost:8081/internal/dev/dispatch`

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440001",
  "notificationId": 100,
  "userId": 1,
  "type": "NOTICE",
  "title": "Postman 테스트",
  "body": "본문입니다",
  "dataJson": null,
  "createdAt": "2026-03-28T12:00:00Z"
}
```

`userId`는 위 device-sync와 같게 맞추면, 해당 사용자의 활성 ANDROID/IOS 토큰으로 FCM이 호출됩니다. `FCM_ENABLED=false`면 전송은 스킵되고 로그만 남을 수 있습니다.

### Kafka 경로로 통합 테스트하고 싶을 때

Postman은 Kafka에 직접 produce 하기 어렵습니다. 터미널에서 예시:

```bash
docker exec -it <kafka-container> kafka-console-producer.sh --bootstrap-server localhost:9092 --topic ruxpress.notification.push.dispatch
```

한 줄 JSON을 붙여 넣으면 기존 `PushDispatchKafkaListener`가 소비합니다. (Bitnami 이미지면 스크립트 경로가 다를 수 있으니 컨테이너 안에서 `find` / 문서 확인.)

또는 **모노리스**에서 outbox → Kafka까지 올린 뒤, 이 서비스만 띄워 E2E로 검증할 수 있습니다.

## 문서

- [docs/kafka-contracts.md](docs/kafka-contracts.md) — 토픽·JSON 필드·DDL ENUM 정합

## 모노리스와의 흐름

1. 모노리스 API가 `notifications` + `outbox_events`를 **같은 트랜잭션**으로 커밋 후 즉시 응답
2. 모노리스 스케줄러가 outbox를 읽어 Kafka에 produce
3. 본 서비스가 `dispatch` / `device-sync` 소비 → `push_devices` 갱신 및 FCM 전송
4. (선택) `push.result` 토픽으로 집계 결과 발행 → 모노리스가 `send_status` 갱신
