---
id: python
title: Python SDK
sidebar_label: Python SDK
sidebar_position: 2
---

# Python SDK 상세 가이드

## 설치

```bash
pip install langfuse
```

## 기본 사용법

### 클라이언트 초기화

```python
from langfuse import Langfuse

# 환경 변수에서 자동 로드
# LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
langfuse = Langfuse()

# 또는 직접 설정
langfuse = Langfuse(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="https://cloud.langfuse.com"
)
```

### 트레이스 생성

```python
# 기본 트레이스
trace = langfuse.trace(name="my-trace")

# 상세 트레이스
trace = langfuse.trace(
    name="chat-request",
    user_id="user-123",           # 사용자 식별
    session_id="session-abc",     # 세션 그룹화
    input="사용자 질문",
    output="AI 응답",
    metadata={
        "environment": "production",
        "version": "1.0.0"
    },
    tags=["chatbot", "production"],
    public=False                   # 공개 링크 생성 여부
)
```

### 스팬 사용

```python
trace = langfuse.trace(name="process-request")

# 스팬 생성
span = trace.span(
    name="data-preprocessing",
    input={"raw_data": "..."},
    metadata={"step": "preprocessing"}
)

# 작업 수행
processed_data = preprocess(data)

# 스팬 종료
span.end(
    output={"processed_data": processed_data},
    metadata={"records_processed": 100}
)
```

### 중첩 스팬

```python
trace = langfuse.trace(name="complex-task")

# 부모 스팬
parent_span = trace.span(name="parent-operation")

# 자식 스팬
child_span = parent_span.span(name="child-operation")
child_span.end(output="child result")

# 또 다른 자식
another_child = parent_span.span(name="another-child")
another_child.end(output="another result")

parent_span.end(output="parent result")
```

### Generation (LLM 호출)

```python
import openai

trace = langfuse.trace(name="llm-request")

# Generation 시작
generation = trace.generation(
    name="gpt-4-completion",
    model="gpt-4",
    model_parameters={
        "temperature": 0.7,
        "max_tokens": 1000,
        "top_p": 1.0
    },
    input=[
        {"role": "system", "content": "당신은 도움이 되는 AI입니다."},
        {"role": "user", "content": "파이썬이란 무엇인가요?"}
    ]
)

# OpenAI API 호출
response = openai.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "당신은 도움이 되는 AI입니다."},
        {"role": "user", "content": "파이썬이란 무엇인가요?"}
    ],
    temperature=0.7,
    max_tokens=1000
)

# Generation 종료
generation.end(
    output=response.choices[0].message.content,
    usage={
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens
    },
    metadata={"finish_reason": response.choices[0].finish_reason}
)
```

## 고급 기능

### 스코어 추가

트레이스나 관찰에 점수를 부여할 수 있습니다:

```python
trace = langfuse.trace(name="scored-trace")

# ... 작업 수행 ...

# 트레이스에 스코어 추가
langfuse.score(
    trace_id=trace.id,
    name="user-satisfaction",
    value=0.9,
    comment="사용자가 긍정적인 피드백을 남김"
)

# 특정 관찰에 스코어 추가
langfuse.score(
    trace_id=trace.id,
    observation_id=generation.id,
    name="response-quality",
    value=0.85,
    data_type="NUMERIC"  # NUMERIC, CATEGORICAL, BOOLEAN
)

# 카테고리 스코어
langfuse.score(
    trace_id=trace.id,
    name="sentiment",
    value="positive",
    data_type="CATEGORICAL"
)
```

### 프롬프트 관리

버전 관리되는 프롬프트 사용:

```python
# 프롬프트 가져오기 (기본 버전)
prompt = langfuse.get_prompt("my-prompt")

# 특정 버전 가져오기
prompt = langfuse.get_prompt("my-prompt", version=2)

# 프롬프트 컴파일 (변수 치환)
compiled = prompt.compile(
    user_name="홍길동",
    topic="파이썬"
)

print(compiled)
# "안녕하세요 홍길동님! 파이썬에 대해 설명해드리겠습니다."

# 트레이스에 프롬프트 연결
trace = langfuse.trace(name="prompt-trace")
generation = trace.generation(
    name="completion",
    prompt=prompt,  # 프롬프트 연결
    input=compiled
)
```

### 컨텍스트 관리자 사용

```python
from langfuse import Langfuse

langfuse = Langfuse()

# 컨텍스트 관리자로 자동 종료
with langfuse.trace(name="managed-trace") as trace:
    with trace.span(name="step-1") as span:
        result = do_something()
        span.update(output=result)

    with trace.generation(name="llm-call") as gen:
        response = call_llm()
        gen.update(
            output=response.content,
            usage={"total_tokens": response.usage.total_tokens}
        )
```

### 비동기 사용

```python
import asyncio
from langfuse import Langfuse

langfuse = Langfuse()

async def async_operation():
    trace = langfuse.trace(name="async-trace")

    # 비동기 작업
    generation = trace.generation(
        name="async-generation",
        model="gpt-4"
    )

    # 비동기 LLM 호출
    response = await async_llm_call()

    generation.end(output=response)

    # 비동기 플러시
    await langfuse.flush_async()

asyncio.run(async_operation())
```

## 에러 처리

```python
trace = langfuse.trace(name="error-handling")
span = trace.span(name="risky-operation")

try:
    result = risky_function()
    span.end(output=result, level="DEFAULT")
except Exception as e:
    # 에러 기록
    span.end(
        output=str(e),
        level="ERROR",
        status_message=f"Error: {type(e).__name__}"
    )
    raise
```

## 전체 예제

```python
from langfuse import Langfuse
import openai

langfuse = Langfuse()

def process_user_query(user_id: str, query: str) -> str:
    # 트레이스 시작
    trace = langfuse.trace(
        name="user-query-processing",
        user_id=user_id,
        input=query
    )

    try:
        # 전처리 스팬
        with trace.span(name="preprocessing") as preprocess_span:
            processed_query = query.strip().lower()
            preprocess_span.update(
                input=query,
                output=processed_query
            )

        # LLM 호출
        generation = trace.generation(
            name="main-llm-call",
            model="gpt-4",
            model_parameters={"temperature": 0.7},
            input=[{"role": "user", "content": processed_query}]
        )

        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": processed_query}]
        )

        output = response.choices[0].message.content

        generation.end(
            output=output,
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens
            }
        )

        # 트레이스 완료
        trace.update(output=output)

        return output

    except Exception as e:
        trace.update(
            output=str(e),
            level="ERROR"
        )
        raise

    finally:
        langfuse.flush()

# 사용
result = process_user_query("user-123", "파이썬이란 무엇인가요?")
print(result)
```

## 다음 단계

- [데코레이터 사용법](./decorators) - 더 간단한 트레이싱
- [OpenAI 통합](../integrations/openai) - OpenAI SDK 자동 통합
- [LangChain 통합](../integrations/langchain) - LangChain 콜백 사용
