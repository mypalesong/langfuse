---
id: anthropic
title: Anthropic 통합
sidebar_label: Anthropic
sidebar_position: 5
---

# Anthropic Claude 통합

Langfuse를 사용하여 Anthropic Claude API 호출을 추적할 수 있습니다.

## 설치

```bash
pip install langfuse anthropic
```

## 수동 통합

Anthropic API는 수동으로 트레이싱을 구현해야 합니다.

### 기본 사용법

```python
from langfuse import Langfuse
import anthropic

langfuse = Langfuse()
client = anthropic.Anthropic()

def chat_with_claude(user_message: str) -> str:
    # 트레이스 생성
    trace = langfuse.trace(name="claude-chat")

    # Generation 시작
    generation = trace.generation(
        name="claude-completion",
        model="claude-3-opus-20240229",
        model_parameters={
            "max_tokens": 1024,
            "temperature": 0.7
        },
        input=[{"role": "user", "content": user_message}]
    )

    # API 호출
    message = client.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=1024,
        temperature=0.7,
        messages=[{"role": "user", "content": user_message}]
    )

    output = message.content[0].text

    # Generation 종료
    generation.end(
        output=output,
        usage={
            "input": message.usage.input_tokens,
            "output": message.usage.output_tokens,
            "total": message.usage.input_tokens + message.usage.output_tokens
        },
        metadata={
            "stop_reason": message.stop_reason,
            "model": message.model
        }
    )

    langfuse.flush()
    return output

# 사용
response = chat_with_claude("인공지능의 미래에 대해 설명해주세요.")
print(response)
```

### 데코레이터 사용

```python
from langfuse.decorators import observe, langfuse_context
import anthropic

client = anthropic.Anthropic()

@observe(as_type="generation")
def claude_completion(messages: list, model: str = "claude-3-opus-20240229") -> str:
    # 현재 관찰 업데이트
    langfuse_context.update_current_observation(
        model=model,
        model_parameters={"max_tokens": 1024}
    )

    # API 호출
    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=messages
    )

    # 토큰 사용량 기록
    langfuse_context.update_current_observation(
        usage={
            "input": message.usage.input_tokens,
            "output": message.usage.output_tokens
        }
    )

    return message.content[0].text

@observe()
def process_query(query: str) -> str:
    # 전처리
    processed = preprocess(query)

    # Claude 호출
    response = claude_completion([
        {"role": "user", "content": processed}
    ])

    return response

# 사용
result = process_query("파이썬과 자바스크립트의 차이점은?")
```

### 스트리밍

```python
from langfuse import Langfuse
import anthropic

langfuse = Langfuse()
client = anthropic.Anthropic()

def stream_claude(user_message: str):
    trace = langfuse.trace(name="claude-streaming")

    generation = trace.generation(
        name="claude-stream",
        model="claude-3-opus-20240229",
        input=[{"role": "user", "content": user_message}]
    )

    full_response = ""
    input_tokens = 0
    output_tokens = 0

    with client.messages.stream(
        model="claude-3-opus-20240229",
        max_tokens=1024,
        messages=[{"role": "user", "content": user_message}]
    ) as stream:
        for text in stream.text_stream:
            full_response += text
            print(text, end="", flush=True)

        # 최종 메시지에서 사용량 가져오기
        final_message = stream.get_final_message()
        input_tokens = final_message.usage.input_tokens
        output_tokens = final_message.usage.output_tokens

    generation.end(
        output=full_response,
        usage={
            "input": input_tokens,
            "output": output_tokens
        }
    )

    langfuse.flush()
    return full_response
```

### 비동기 사용

```python
import asyncio
from langfuse import Langfuse
import anthropic

langfuse = Langfuse()
client = anthropic.AsyncAnthropic()

@observe(as_type="generation")
async def async_claude(prompt: str) -> str:
    langfuse_context.update_current_observation(
        model="claude-3-opus-20240229"
    )

    message = await client.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    langfuse_context.update_current_observation(
        usage={
            "input": message.usage.input_tokens,
            "output": message.usage.output_tokens
        }
    )

    return message.content[0].text

# 실행
async def main():
    result = await async_claude("비동기 프로그래밍이란?")
    print(result)

asyncio.run(main())
```

### 도구 사용 (Tool Use)

```python
from langfuse import Langfuse
import anthropic

langfuse = Langfuse()
client = anthropic.Anthropic()

tools = [
    {
        "name": "get_weather",
        "description": "특정 위치의 현재 날씨를 가져옵니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "도시 이름"
                }
            },
            "required": ["location"]
        }
    }
]

def chat_with_tools(user_message: str):
    trace = langfuse.trace(name="claude-tools")

    generation = trace.generation(
        name="tool-call",
        model="claude-3-opus-20240229",
        input=[{"role": "user", "content": user_message}],
        metadata={"tools": [t["name"] for t in tools]}
    )

    message = client.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=1024,
        tools=tools,
        messages=[{"role": "user", "content": user_message}]
    )

    # 도구 사용 여부 확인
    tool_use = None
    for block in message.content:
        if block.type == "tool_use":
            tool_use = {
                "name": block.name,
                "input": block.input
            }
            break

    generation.end(
        output={
            "content": message.content,
            "tool_use": tool_use
        },
        usage={
            "input": message.usage.input_tokens,
            "output": message.usage.output_tokens
        }
    )

    langfuse.flush()
    return message

# 사용
response = chat_with_tools("서울 날씨 어때?")
```

## Claude 모델 목록

| 모델 | 설명 |
|------|------|
| `claude-3-opus-20240229` | 가장 강력한 모델 |
| `claude-3-sonnet-20240229` | 균형 잡힌 성능 |
| `claude-3-haiku-20240307` | 가장 빠른 모델 |
| `claude-3-5-sonnet-20241022` | 최신 Sonnet |

## 비용 추적

Langfuse는 Claude 모델의 토큰당 비용을 자동으로 계산합니다:

```python
generation.end(
    output=response,
    usage={
        "input": input_tokens,
        "output": output_tokens
    }
    # 비용은 모델에 따라 자동 계산됨
)
```

## 다음 단계

- [LangChain 통합](./langchain) - LangChain과 함께 사용
- [Python SDK](../sdk/python) - 수동 트레이싱 상세
