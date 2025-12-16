---
id: openai
title: OpenAI 통합
sidebar_label: OpenAI
sidebar_position: 2
---

# OpenAI SDK 통합

Langfuse의 OpenAI 래퍼를 사용하면 기존 코드 변경 없이 모든 OpenAI 호출을 자동으로 트레이싱할 수 있습니다.

## Python 통합

### 설치

```bash
pip install langfuse openai
```

### 기본 사용법

```python
# 기존 import 변경
# from openai import OpenAI
from langfuse.openai import openai

# 나머지 코드는 동일
response = openai.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "안녕하세요!"}]
)

print(response.choices[0].message.content)
# 자동으로 Langfuse에 기록됨
```

### 클라이언트 인스턴스 사용

```python
from langfuse.openai import OpenAI

# 기존 방식과 동일
client = OpenAI(api_key="sk-...")

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### 트레이스 메타데이터 추가

```python
from langfuse.openai import openai

response = openai.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "안녕하세요!"}],

    # Langfuse 전용 파라미터
    name="chat-completion",  # Generation 이름
    trace_id="existing-trace-id",  # 기존 트레이스에 연결
    parent_observation_id="parent-span-id",  # 부모 스팬
    user_id="user-123",
    session_id="session-456",
    tags=["production", "v1"],
    metadata={"source": "web-app"}
)
```

### 스트리밍

```python
from langfuse.openai import openai

stream = openai.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "긴 이야기를 해주세요"}],
    stream=True,

    # 메타데이터
    name="streaming-completion"
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")

# 스트리밍 완료 후 자동으로 기록됨
```

### 비동기 사용

```python
import asyncio
from langfuse.openai import AsyncOpenAI

client = AsyncOpenAI()

async def main():
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": "Hello"}],
        name="async-completion"
    )
    return response.choices[0].message.content

result = asyncio.run(main())
```

### @observe 데코레이터와 함께 사용

```python
from langfuse.decorators import observe
from langfuse.openai import openai

@observe()
def chat_with_context(user_message: str) -> str:
    # 데코레이터의 트레이스에 자동 연결
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "친절한 AI 어시스턴트입니다."},
            {"role": "user", "content": user_message}
        ]
    )
    return response.choices[0].message.content

@observe()
def multi_step_process(query: str) -> str:
    # 첫 번째 LLM 호출
    analysis = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": f"분석: {query}"}],
        name="analysis-step"
    )

    # 두 번째 LLM 호출
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "user", "content": f"응답 생성: {analysis.choices[0].message.content}"}
        ],
        name="response-step"
    )

    return response.choices[0].message.content

# 결과:
# multi_step_process (trace)
# ├── analysis-step (generation)
# └── response-step (generation)
```

### 함수 호출 (Function Calling)

```python
from langfuse.openai import openai

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "특정 위치의 현재 날씨를 가져옵니다",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "도시 이름"}
                },
                "required": ["location"]
            }
        }
    }
]

response = openai.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{"role": "user", "content": "서울 날씨 어때?"}],
    tools=tools,
    tool_choice="auto",
    name="function-calling"
)

# 함수 호출 정보도 자동으로 기록됨
```

### 임베딩

```python
from langfuse.openai import openai

response = openai.embeddings.create(
    model="text-embedding-3-small",
    input="검색할 텍스트",
    name="embedding-generation"
)

embedding = response.data[0].embedding
# 임베딩 호출도 기록됨
```

---

## JavaScript/TypeScript 통합

### 설치

```bash
npm install langfuse openai
```

### 기본 사용법

```typescript
import { observeOpenAI } from "langfuse";
import OpenAI from "openai";

const openai = observeOpenAI(new OpenAI());

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response.choices[0].message.content);
// 자동으로 Langfuse에 기록됨
```

### 트레이스 메타데이터 추가

```typescript
import { observeOpenAI } from "langfuse";
import OpenAI from "openai";

const openai = observeOpenAI(new OpenAI(), {
  // 기본 클라이언트 옵션
  clientInitParams: {
    publicKey: "pk-lf-...",
    secretKey: "sk-lf-...",
  }
});

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello!" }],

  // Langfuse 옵션
  langfuseTraceId: "existing-trace-id",
  langfuseParentObservationId: "parent-span-id",
  langfuseOptions: {
    userId: "user-123",
    sessionId: "session-456",
    tags: ["production"],
    metadata: { source: "api" }
  }
});
```

### 스트리밍

```typescript
import { observeOpenAI } from "langfuse";
import OpenAI from "openai";

const openai = observeOpenAI(new OpenAI());

const stream = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Tell me a story" }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

---

## 비용 추적

Langfuse는 OpenAI 모델의 토큰 사용량과 비용을 자동으로 계산합니다:

| 정보 | 자동 추적 |
|------|----------|
| 입력 토큰 | O |
| 출력 토큰 | O |
| 총 토큰 | O |
| 비용 (USD) | O (모델별 가격 적용) |

대시보드에서 확인 가능:
- 일별/주별/월별 비용 추이
- 모델별 비용 분석
- 사용자별 비용 추적
- 프로젝트별 비용 리포트

## 다음 단계

- [LangChain 통합](./langchain) - LangChain과 함께 사용
- [데코레이터](../sdk/decorators) - Python 데코레이터 활용
