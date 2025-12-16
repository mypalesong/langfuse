---
id: installation
title: 설치 가이드
sidebar_label: 설치 가이드
sidebar_position: 2
---

# Langfuse 설치 가이드

Langfuse는 두 가지 방법으로 사용할 수 있습니다:
1. **Langfuse Cloud** - 관리형 클라우드 서비스 (권장)
2. **Self-Hosting** - 직접 서버에 설치

## 1. Langfuse Cloud 사용하기 (권장)

가장 빠르게 시작할 수 있는 방법입니다.

### 단계 1: 계정 생성

1. [Langfuse Cloud](https://cloud.langfuse.com)에 접속
2. GitHub 또는 이메일로 회원가입
3. 새 프로젝트 생성

### 단계 2: API 키 발급

1. 프로젝트 설정 → API Keys 메뉴 이동
2. "Create new API key" 클릭
3. 발급된 키 저장:
   - `LANGFUSE_PUBLIC_KEY`: 공개 키
   - `LANGFUSE_SECRET_KEY`: 비밀 키

### 단계 3: SDK 설치

**Python:**
```bash
pip install langfuse
```

**JavaScript/TypeScript:**
```bash
npm install langfuse
# 또는
yarn add langfuse
# 또는
pnpm add langfuse
```

### 단계 4: 환경 변수 설정

```bash
# .env 파일
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com  # Cloud 사용 시
```

---

## 2. Self-Hosting (Docker)

자체 서버에 Langfuse를 설치하는 방법입니다.

### 요구 사항

- Docker 및 Docker Compose
- PostgreSQL 데이터베이스
- 최소 2GB RAM

### Docker Compose로 설치

#### 단계 1: docker-compose.yml 생성

```yaml
version: '3.8'

services:
  langfuse-server:
    image: langfuse/langfuse:latest
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres
      - NEXTAUTH_SECRET=mysecret  # 랜덤 문자열로 변경
      - SALT=mysalt  # 랜덤 문자열로 변경
      - NEXTAUTH_URL=http://localhost:3000
      - TELEMETRY_ENABLED=${TELEMETRY_ENABLED:-true}
      - LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES=${LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES:-false}

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=postgres
    ports:
      - "5432:5432"
    volumes:
      - database_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  database_data:
    driver: local
```

#### 단계 2: 실행

```bash
docker-compose up -d
```

#### 단계 3: 접속

- 브라우저에서 `http://localhost:3000` 접속
- 계정 생성 및 로그인

### Kubernetes로 설치

Helm 차트를 사용하여 Kubernetes에 설치할 수 있습니다.

```bash
helm repo add langfuse https://langfuse.github.io/langfuse-helm
helm repo update
helm install langfuse langfuse/langfuse
```

---

## 3. Python SDK 상세 설정

### 기본 설정

```python
from langfuse import Langfuse

# 환경 변수에서 자동으로 읽어옴
langfuse = Langfuse()

# 또는 직접 지정
langfuse = Langfuse(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="https://cloud.langfuse.com"
)
```

### 고급 설정

```python
from langfuse import Langfuse

langfuse = Langfuse(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="https://cloud.langfuse.com",

    # 선택적 설정
    release="v1.0.0",  # 애플리케이션 버전
    debug=True,  # 디버그 모드
    threads=5,  # 비동기 전송 스레드 수
    flush_at=20,  # 배치 크기
    flush_interval=0.5,  # 전송 간격 (초)
    max_retries=3,  # 재시도 횟수
    timeout=20,  # 타임아웃 (초)
)
```

---

## 4. JavaScript/TypeScript SDK 상세 설정

### 기본 설정

```typescript
import Langfuse from "langfuse";

// 환경 변수에서 자동으로 읽어옴
const langfuse = new Langfuse();

// 또는 직접 지정
const langfuse = new Langfuse({
  publicKey: "pk-lf-...",
  secretKey: "sk-lf-...",
  baseUrl: "https://cloud.langfuse.com"
});
```

### Next.js에서 사용

```typescript
// lib/langfuse.ts
import Langfuse from "langfuse";

const langfuseClient = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_HOST
});

export default langfuseClient;
```

---

## 설치 확인

SDK가 올바르게 설정되었는지 확인:

**Python:**
```python
from langfuse import Langfuse

langfuse = Langfuse()

# 테스트 트레이스 생성
trace = langfuse.trace(name="test-trace")
trace.span(name="test-span", input="Hello", output="World")

# 즉시 전송
langfuse.flush()

print("Langfuse 설정 완료!")
```

**JavaScript:**
```typescript
import Langfuse from "langfuse";

const langfuse = new Langfuse();

// 테스트 트레이스 생성
const trace = langfuse.trace({ name: "test-trace" });
trace.span({ name: "test-span", input: "Hello", output: "World" });

// 즉시 전송
await langfuse.flushAsync();

console.log("Langfuse 설정 완료!");
```

Langfuse 대시보드에서 테스트 트레이스가 나타나면 설정이 완료된 것입니다.

---

## 다음 단계

- [SDK 사용법](./sdk/overview) - 트레이싱 기본 사용법 알아보기
- [통합 가이드](./integrations/overview) - LangChain 등과의 통합
