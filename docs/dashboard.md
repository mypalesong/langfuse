---
id: dashboard
title: 대시보드 사용법
sidebar_label: 대시보드
sidebar_position: 5
---

# Langfuse 대시보드 사용 가이드

Langfuse 대시보드는 LLM 애플리케이션의 모니터링, 분석, 디버깅을 위한 웹 인터페이스입니다.

## 대시보드 접속

- **Langfuse Cloud**: [cloud.langfuse.com](https://cloud.langfuse.com)
- **Self-hosted**: 설치한 서버 주소 (예: `http://localhost:3000`)

## 주요 메뉴

### 1. Traces (트레이스)

모든 트레이스를 목록으로 보고 상세 내용을 확인할 수 있습니다.

#### 트레이스 목록
- 시간순 정렬된 모든 트레이스
- 검색 및 필터링 지원
- 주요 메트릭 (지연 시간, 비용, 토큰) 표시

#### 필터 옵션
| 필터 | 설명 |
|------|------|
| Name | 트레이스 이름으로 필터 |
| User ID | 특정 사용자의 트레이스만 |
| Session ID | 특정 세션의 트레이스만 |
| Tags | 태그로 필터 |
| Time Range | 시간 범위 지정 |
| Level | ERROR, WARNING 등 레벨 |

#### 트레이스 상세
- **타임라인 뷰**: 실행 흐름을 시각적으로 표시
- **입력/출력**: 각 단계의 입출력 데이터
- **메타데이터**: 추가 정보 확인
- **토큰/비용**: LLM 호출별 사용량

### 2. Generations (제너레이션)

LLM 호출만 별도로 모아서 볼 수 있습니다.

#### 확인 가능한 정보
- 모델명 및 버전
- 입력 프롬프트
- 출력 응답
- 토큰 사용량 (입력/출력/총합)
- 비용 (자동 계산)
- 지연 시간
- 모델 파라미터 (temperature 등)

### 3. Sessions (세션)

동일한 `session_id`로 그룹화된 트레이스를 확인합니다.

#### 세션 분석
- 사용자 대화 흐름 추적
- 세션별 총 비용/토큰
- 세션 지속 시간
- 세션 내 트레이스 수

### 4. Users (사용자)

`user_id`별로 사용 현황을 분석합니다.

#### 사용자 분석
- 사용자별 요청 수
- 사용자별 비용
- 활성 사용자 추이
- 사용자별 평균 응답 품질

### 5. Scores (스코어)

트레이스와 관찰에 부여된 점수를 관리합니다.

#### 스코어 타입
| 타입 | 설명 | 예시 |
|------|------|------|
| NUMERIC | 숫자 점수 | 0.0 ~ 1.0 |
| CATEGORICAL | 카테고리 | "positive", "negative" |
| BOOLEAN | 참/거짓 | true, false |

#### 스코어 소스
- **User**: 사용자 피드백
- **API**: SDK를 통한 점수
- **Annotation**: 수동 라벨링
- **LLM**: LLM 기반 자동 평가

### 6. Prompts (프롬프트)

프롬프트를 버전 관리하고 관리합니다.

#### 프롬프트 관리 기능
- **버전 관리**: 프롬프트 변경 이력 추적
- **A/B 테스트**: 여러 버전 비교
- **라벨링**: production, staging 등 라벨 지정
- **변수**: `{{variable}}` 형식의 변수 지원

#### 프롬프트 생성

```
1. Prompts 메뉴 → Create Prompt
2. 이름 및 내용 입력
3. 변수는 {{variable}} 형식으로 지정
4. Save 클릭
```

#### 코드에서 사용

```python
from langfuse import Langfuse

langfuse = Langfuse()

# 프롬프트 가져오기
prompt = langfuse.get_prompt("my-prompt")

# 변수 치환
compiled = prompt.compile(
    user_name="홍길동",
    topic="AI"
)
```

### 7. Datasets (데이터셋)

평가용 데이터셋을 관리합니다.

#### 데이터셋 구성
- **Dataset**: 데이터셋 컨테이너
- **Dataset Item**: 개별 테스트 케이스
  - Input: 입력 데이터
  - Expected Output: 기대 출력 (선택)
  - Metadata: 추가 정보

#### 데이터셋 생성

```python
from langfuse import Langfuse

langfuse = Langfuse()

# 데이터셋 생성
dataset = langfuse.create_dataset(name="qa-dataset")

# 아이템 추가
langfuse.create_dataset_item(
    dataset_name="qa-dataset",
    input={"question": "파이썬이란?"},
    expected_output="프로그래밍 언어입니다.",
    metadata={"category": "programming"}
)
```

### 8. Metrics (메트릭)

전체 프로젝트의 통계를 확인합니다.

#### 주요 메트릭
| 메트릭 | 설명 |
|--------|------|
| Total Traces | 전체 트레이스 수 |
| Total Cost | 총 비용 |
| Total Tokens | 총 토큰 사용량 |
| Avg Latency | 평균 응답 시간 |
| Error Rate | 에러 발생률 |

#### 시각화
- 일별/주별/월별 추이 그래프
- 모델별 사용량 비교
- 비용 분석 차트

---

## 설정 (Settings)

### Project Settings

- **API Keys**: API 키 관리
- **Members**: 팀원 초대 및 권한 관리
- **Integrations**: 외부 서비스 연동

### API Keys

```
1. Settings → API Keys
2. Create new API key
3. Public Key와 Secret Key 저장
```

⚠️ **주의**: Secret Key는 생성 시에만 표시됩니다.

### 팀 관리

| 역할 | 권한 |
|------|------|
| Owner | 모든 권한 |
| Admin | 설정 변경, 멤버 관리 |
| Member | 읽기/쓰기 |
| Viewer | 읽기 전용 |

---

## 데이터 내보내기

### CSV 내보내기

트레이스, 제너레이션, 스코어 데이터를 CSV로 내보낼 수 있습니다:

```
1. 해당 메뉴로 이동
2. 필터 적용 (선택)
3. Export → CSV
```

### API를 통한 내보내기

```python
from langfuse import Langfuse

langfuse = Langfuse()

# 트레이스 조회
traces = langfuse.fetch_traces(
    page=1,
    limit=100,
    user_id="user-123",  # 선택적 필터
    tags=["production"]   # 선택적 필터
)

for trace in traces.data:
    print(trace.name, trace.id)
```

---

## 팁과 트릭

### 효과적인 트레이스 이름 짓기

```python
# 좋은 예
trace = langfuse.trace(name="user-chat-completion")
trace = langfuse.trace(name="document-qa-rag")
trace = langfuse.trace(name="code-generation-v2")

# 나쁜 예
trace = langfuse.trace(name="trace1")
trace = langfuse.trace(name="test")
```

### 태그 활용

```python
trace = langfuse.trace(
    name="chat",
    tags=[
        "production",      # 환경
        "v2.1",           # 버전
        "premium-user",   # 사용자 유형
        "long-context"    # 특성
    ]
)
```

### 세션으로 대화 그룹화

```python
session_id = f"session-{user_id}-{timestamp}"

# 같은 세션의 모든 트레이스
for message in conversation:
    trace = langfuse.trace(
        name="chat-turn",
        session_id=session_id,
        user_id=user_id
    )
```

## 다음 단계

- [SDK 사용법](./sdk/overview) - 프로그래밍 방식으로 데이터 관리
- [통합 가이드](./integrations/overview) - 프레임워크 통합
