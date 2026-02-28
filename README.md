# RuxPress - 한러 구매대행 플랫폼

한국-러시아 간 구매대행 서비스를 제공하는 웹 플랫폼입니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Spring Boot 3.2.5, Java 21, Spring Security, Spring Data JPA |
| Frontend | React 18, TypeScript 5.6, Vite 5, React Router 6 |
| Database | H2 (로컬), MariaDB (dev/prod) |
| Infra | Docker, Docker Compose, Nginx |

## 프로젝트 구조

```
ruxpress/
├── back/                          # Spring Boot 백엔드
│   └── src/main/java/com/ruxpress/
│       ├── common/                # 공통 모듈 (ApiResponse, BaseEntity, 예외처리)
│       ├── config/                # 설정 (Security, CORS, JPA, i18n)
│       └── domain/                # 도메인별 패키지
│           ├── user/              # 회원 관리
│           ├── purchase/          # 구매 요청
│           ├── inquiry/           # 1:1 문의
│           ├── notice/            # 공지사항
│           ├── exchange/          # 환율
│           ├── notification/      # 알림
│           ├── admin/             # 관리자
│           ├── balance/           # 잔액
│           ├── transaction/      # 거래내역
│           └── example/           # 연결 테스트용 API
├── front/                         # React 프론트엔드
│   └── src/
│       ├── components/            # 공통 컴포넌트 (Layout)
│       ├── pages/                 # 페이지 (Home, Example)
│       ├── hooks/                 # 커스텀 hooks (useTranslation)
│       ├── utils/                 # 유틸리티 (api, constants, exception)
│       ├── types/                 # TypeScript 타입 정의
│       ├── i18n/                  # 다국어 리소스 (ko, ru, en)
│       └── styles/                # CSS
├── script/                        # 운영 스크립트
├── sql/                           # DB 스크립트
└── docker-compose.yml             # Docker 오케스트레이션
```

## 실행 방법

### 사전 요구사항

- Docker & Docker Compose 설치

### Docker로 실행 (권장)

```bash
# 빌드 및 실행
docker compose up -d

# 또는 스크립트 사용
./script/manage.sh start      # Linux/Mac
script\manage.bat start       # Windows
```

## 접속 URL

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost |
| 백엔드 API | http://localhost:8080 |
| Health Check | http://localhost:8080/api/health |
| H2 Console | http://localhost:8080/h2-console |
| 연결 테스트 페이지 | http://localhost/example |

## 테스트 API

```bash
# Health Check
curl http://localhost:8080/api/health

# 인사 API (다국어)
curl http://localhost:8080/api/v1/examples/hello
curl -H "Accept-Language: ru" http://localhost:8080/api/v1/examples/hello
curl -H "Accept-Language: en" http://localhost:8080/api/v1/examples/hello

# 서버 시간
curl http://localhost:8080/api/v1/examples/time

# Echo
curl -X POST http://localhost:8080/api/v1/examples/echo \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

## 스크립트 (script/)

| 스크립트 | 설명 |
|----------|------|
| init.sh | 서버 최초 환경 설정. 패키지 설치(git, docker), /svc/RuxPress 디렉터리 생성, 리포지토리 clone, Docker 이미지 빌드까지 수행. 배포 서버에서 한 번만 실행. |
| manage.sh / manage.bat | 서비스 관리 스크립트. start(컨테이너 시작), stop(컨테이너 중지), restart(재시작) 명령 지원. |
| rebuild.sh / rebuild.bat | 코드 변경 후 재배포. 컨테이너 중지 → 이미지 재빌드 → 컨테이너 시작을 순서대로 수행. |

## 프로필 설정

| 프로필 | 용도 | DB |
|--------|------|-----|
| local (기본) | 로컬 개발 | H2 in-memory |
| dev | 개발 서버 | MariaDB (환경변수) |
| prod | 운영 서버 | MariaDB (환경변수) |
| docker | Docker 환경 | MariaDB (Docker 내부 호스트) |

## 다국어 지원

한국어(ko), 러시아어(ru), 영어(en) 3개 언어를 지원합니다.

- **백엔드**: Accept-Language 헤더 기반 메시지 자동 전환
- **프론트엔드**: 헤더 언어 전환 버튼으로 UI 언어 변경
