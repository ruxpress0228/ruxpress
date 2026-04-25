# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RuxPress is a multilingual (Korean/Russian/English) financial service platform for currency exchange (KRW ↔ RUB). The system is composed of three backend services, a React frontend, and an Android app.

## Repository Structure

```
ruxpress/
├── back/           # Spring Boot monolith (Java 21) — main REST API
├── front/          # React 18 + TypeScript (Vite) — web frontend
├── mobilePush/     # Spring Boot microservice — Firebase FCM push notifications
├── app/android/    # Kotlin Android app
├── script/         # manage.sh / rebuild.sh deployment scripts
├── sql/            # Database DDL (MariaDB)
└── docker-compose.yml  # Full stack orchestration
```

## Common Commands

### Full Stack (Docker)
```bash
docker compose up -d                    # Start all services
docker compose down                     # Stop all services
./script/rebuild.sh                     # Rebuild images and restart
```

### Frontend (`front/`)
```bash
npm run dev          # Dev server on :3000 (proxies /api → :8080)
npm run build        # TypeScript check + Vite build
npm test             # Vitest single run
npm run test:watch   # Vitest watch mode
```

### Backend (`back/`)
```bash
mvn spring-boot:run                                    # Run with local profile (H2, Kafka at localhost:9092)
mvn spring-boot:run -Dspring-boot.run.profiles=dev     # Run with dev profile (MariaDB)
mvn test                                               # Run all tests
mvn clean package                                      # Build JAR
```

### Mobile Push Service (`mobilePush/`)
```bash
# First start local infrastructure:
docker compose up -d                                              # Kafka + PostgreSQL

mvn spring-boot:run -Dspring-boot.run.profiles=no-docker         # H2, Kafka disabled
mvn spring-boot:run -Dspring-boot.run.profiles=local             # H2 + Docker Kafka/Postgres
mvn spring-boot:run -Dspring-boot.run.profiles=local-kafka       # H2 + local Kafka
```

## Architecture

### Services and Ports

| Service | Port | Notes |
|---------|------|-------|
| Frontend (Nginx) | 80 | Served via Nginx in Docker |
| Backend API | 8080 | `/api/health` for health check; `/h2-console` in local profile |
| Push Service | 8081 | Firebase FCM dispatcher |
| Kafka | 9092 (host) / 29092 (Docker internal) | |
| PostgreSQL (push) | 5433 | Only used by mobilePush |

### Inter-Service Communication

- **Frontend → Backend:** Vite dev proxy `/api` → `http://localhost:8080`. In production, Nginx proxies `/api` to the backend container.
- **Backend → Push Service:** Kafka topics:
  - `ruxpress.notification.push.dispatch` — triggers FCM push
  - `ruxpress.user.device.sync` — syncs FCM device tokens
  - `ruxpress.notification.push.result` — optional push delivery result
- **Push Service → Firebase:** Firebase Admin SDK (FCM)
- **Android App → Firebase:** Standard FCM receive

### Backend Domain Structure (`back/src/main/java/com/ruxpress/`)

Each domain follows a layered pattern (Controller → Service → Repository):

- `user` — registration, login, JWT auth, email verification
- `purchase` — purchase request lifecycle
- `inquiry` — 1:1 customer inquiries and replies
- `notice` — admin announcements
- `exchange` — KRW ↔ RUB exchange rate management
- `notification` — in-app notification records
- `balance` — user account balances
- `transaction` — transaction history
- `banktransfer` — bank transfer operations
- `outbox` — transactional outbox pattern for reliable Kafka event delivery
- `admin` — admin user management
- `common` — shared `ApiResponse`, `BaseEntity`, global exception handling
- `config` — Spring Security, JWT, CORS, Kafka, Mail, JPA configuration

### Backend Spring Profiles

| Profile | Database | Kafka |
|---------|----------|-------|
| `local` (default) | H2 in-memory | localhost:9092 |
| `dev` | MariaDB | localhost:9092 |
| `docker` | MariaDB (hostname `mariadb`) | kafka:29092 |
| `prod` | MariaDB (env vars) | env-based |

### Frontend Structure (`front/src/`)

- `main.tsx` → `components/Root.tsx` → route definitions in `routes.ts`
- Pages split under `pages/user/` and `pages/admin/`
- Internationalization via `i18n/` (ko, ru, en); language detected from `Accept-Language` or toggled in UI
- Styling: TailwindCSS 4 + Radix UI components

### Transactional Outbox Pattern

The backend uses an outbox table (`outbox_events`) to guarantee at-least-once Kafka delivery. Events are written to the outbox within the same DB transaction as the business operation, then a separate scheduler polls and publishes them to Kafka. This pattern is concentrated in the `outbox` domain.

### Database

- **Backend:** MariaDB in prod/dev; H2 for local. DDL: `sql/DDL.sql`
- **Push Service:** PostgreSQL. Flyway migrations under `mobilePush/src/main/resources/db/migration/`

### CI/CD

GitHub Actions auto-deploys:
- Push to `development` → `deploy-dev.yml` — SSH to dev server, runs `rebuild.sh`
- Push to `master` → `deploy-prod.yml` — SSH to prod server, runs `rebuild.sh`

Deployment path on servers: `/svc/RuxPress`

## Kafka Event Contracts

Detailed topic schemas and message structures are documented in [mobilePush/docs/kafka-contracts.md](mobilePush/docs/kafka-contracts.md).
