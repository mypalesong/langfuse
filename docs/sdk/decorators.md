---
id: decorators
title: Python 데코레이터
sidebar_label: 데코레이터 (Python)
sidebar_position: 4
---

# Python 데코레이터 사용 가이드

Langfuse의 Python 데코레이터를 사용하면 코드 변경을 최소화하면서 쉽게 트레이싱을 구현할 수 있습니다.

## 설치

```bash
pip install langfuse
```

## 기본 사용법

### @observe 데코레이터

`@observe` 데코레이터는 함수 호출을 자동으로 트레이싱합니다:

```python
from langfuse.decorators import observe

@observe()
def my_function(input_text: str) -> str:
    # 이 함수의 입력/출력이 자동으로 기록됨
    result = process(input_text)
    return result
```

### 기본 예제

```python
from langfuse.decorators import observe, langfuse_context
import openai

@observe()
def process_query(query: str) -> str:
    """쿼리를 처리하고 응답을 반환"""
    # 전처리
    cleaned = query.strip().lower()

    # LLM 호출
    response = call_llm(cleaned)

    return response

@observe()
def call_llm(prompt: str) -> str:
    """LLM API를 호출"""
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

# 사용
result = process_query("파이썬이란 무엇인가요?")
```

## 고급 설정

### 트레이스 이름 지정

```python
@observe(name="custom-operation-name")
def my_function():
    pass
```

### Generation으로 표시

LLM 호출을 Generation으로 기록하려면:

```python
@observe(as_type="generation")
def call_llm(prompt: str) -> str:
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

### 입력/출력 캡처 제어

```python
# 입력만 캡처
@observe(capture_input=True, capture_output=False)
def sensitive_function(data):
    return process_sensitive_data(data)

# 둘 다 캡처 안 함
@observe(capture_input=False, capture_output=False)
def very_sensitive_function(data):
    return process_very_sensitive_data(data)
```

## langfuse_context 사용

`langfuse_context`를 사용하면 현재 관찰에 추가 정보를 기록할 수 있습니다:

### 메타데이터 추가

```python
from langfuse.decorators import observe, langfuse_context

@observe()
def process_data(data: dict):
    # 메타데이터 업데이트
    langfuse_context.update_current_observation(
        metadata={
            "data_size": len(data),
            "keys": list(data.keys())
        }
    )

    result = transform(data)

    # 추가 메타데이터
    langfuse_context.update_current_observation(
        metadata={"result_size": len(result)}
    )

    return result
```

### 토큰 사용량 기록

```python
@observe(as_type="generation")
def llm_call(prompt: str):
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    # 토큰 사용량 기록
    langfuse_context.update_current_observation(
        model="gpt-4",
        usage={
            "input": response.usage.prompt_tokens,
            "output": response.usage.completion_tokens,
            "total": response.usage.total_tokens
        }
    )

    return response.choices[0].message.content
```

### 트레이스 정보 설정

```python
@observe()
def main_function(user_id: str, query: str):
    # 현재 트레이스에 사용자 정보 추가
    langfuse_context.update_current_trace(
        user_id=user_id,
        session_id="session-123",
        tags=["production", "v2"],
        metadata={"source": "api"}
    )

    return process(query)
```

### 스코어 추가

```python
@observe()
def evaluated_function(input_text: str):
    result = process(input_text)

    # 현재 관찰에 스코어 추가
    langfuse_context.score_current_observation(
        name="quality",
        value=0.9,
        comment="높은 품질의 응답"
    )

    # 트레이스에 스코어 추가
    langfuse_context.score_current_trace(
        name="user-satisfaction",
        value=1,
        data_type="NUMERIC"
    )

    return result
```

## 중첩 함수

데코레이터가 적용된 함수를 중첩 호출하면 자동으로 계층 구조가 생성됩니다:

```python
from langfuse.decorators import observe

@observe()
def main_workflow(input_data: str) -> str:
    # 이 함수가 최상위 트레이스가 됨

    step1_result = preprocessing(input_data)
    step2_result = llm_processing(step1_result)
    final_result = postprocessing(step2_result)

    return final_result

@observe()
def preprocessing(data: str) -> str:
    # main_workflow의 자식 스팬이 됨
    return data.strip().lower()

@observe(as_type="generation")
def llm_processing(data: str) -> str:
    # main_workflow의 자식 generation이 됨
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": data}]
    )
    return response.choices[0].message.content

@observe()
def postprocessing(data: str) -> str:
    # main_workflow의 자식 스팬이 됨
    return data.upper()

# 결과 계층 구조:
# main_workflow (trace)
# ├── preprocessing (span)
# ├── llm_processing (generation)
# └── postprocessing (span)
```

## 비동기 함수

비동기 함수도 동일하게 사용:

```python
import asyncio
from langfuse.decorators import observe

@observe()
async def async_main():
    result1 = await async_step1()
    result2 = await async_step2(result1)
    return result2

@observe()
async def async_step1():
    await asyncio.sleep(0.1)
    return "step1 result"

@observe(as_type="generation")
async def async_step2(input_data: str):
    # 비동기 LLM 호출
    response = await openai.chat.completions.acreate(
        model="gpt-4",
        messages=[{"role": "user", "content": input_data}]
    )
    return response.choices[0].message.content

# 실행
asyncio.run(async_main())
```

## 클래스 메서드

```python
from langfuse.decorators import observe

class ChatBot:
    def __init__(self, model: str = "gpt-4"):
        self.model = model

    @observe()
    def chat(self, message: str) -> str:
        processed = self._preprocess(message)
        response = self._generate(processed)
        return self._postprocess(response)

    @observe()
    def _preprocess(self, text: str) -> str:
        return text.strip()

    @observe(as_type="generation")
    def _generate(self, prompt: str) -> str:
        langfuse_context.update_current_observation(
            model=self.model
        )
        # LLM 호출
        return "Generated response"

    @observe()
    def _postprocess(self, text: str) -> str:
        return text.strip()

# 사용
bot = ChatBot()
response = bot.chat("안녕하세요!")
```

## 에러 처리

예외가 발생하면 자동으로 에러 상태가 기록됩니다:

```python
from langfuse.decorators import observe

@observe()
def risky_operation(data: str):
    if not data:
        raise ValueError("Data cannot be empty")

    return process(data)

# 예외 발생 시:
# - level이 "ERROR"로 설정됨
# - status_message에 에러 메시지 기록
# - 트레이스는 정상적으로 전송됨
```

## 전체 예제

```python
from langfuse.decorators import observe, langfuse_context
import openai

@observe()
def main(user_id: str, query: str) -> dict:
    """메인 처리 함수"""

    # 트레이스 메타데이터 설정
    langfuse_context.update_current_trace(
        user_id=user_id,
        metadata={"source": "api", "version": "1.0"}
    )

    # 쿼리 분석
    intent = analyze_intent(query)

    # 응답 생성
    response = generate_response(query, intent)

    # 품질 평가
    quality_score = evaluate_response(response)

    # 스코어 기록
    langfuse_context.score_current_trace(
        name="response-quality",
        value=quality_score
    )

    return {
        "response": response,
        "intent": intent,
        "quality": quality_score
    }

@observe()
def analyze_intent(query: str) -> str:
    """쿼리 의도 분석"""
    langfuse_context.update_current_observation(
        metadata={"query_length": len(query)}
    )

    # 간단한 의도 분류
    if "?" in query:
        return "question"
    return "statement"

@observe(as_type="generation")
def generate_response(query: str, intent: str) -> str:
    """LLM을 사용하여 응답 생성"""

    system_prompt = f"사용자 의도: {intent}. 적절한 응답을 생성하세요."

    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        temperature=0.7
    )

    # 토큰 사용량 기록
    langfuse_context.update_current_observation(
        model="gpt-4",
        usage={
            "input": response.usage.prompt_tokens,
            "output": response.usage.completion_tokens
        }
    )

    return response.choices[0].message.content

@observe()
def evaluate_response(response: str) -> float:
    """응답 품질 평가"""
    # 간단한 휴리스틱 평가
    score = min(len(response) / 100, 1.0)
    return round(score, 2)

# 실행
if __name__ == "__main__":
    result = main("user-123", "파이썬의 장점은 무엇인가요?")
    print(result)
```

## 데이터 플러시

데코레이터는 함수 완료 시 자동으로 데이터를 전송합니다. 즉시 전송이 필요한 경우:

```python
from langfuse.decorators import langfuse_context

@observe()
def my_function():
    # 작업 수행
    result = do_work()

    # 즉시 플러시
    langfuse_context.flush()

    return result
```

## 다음 단계

- [OpenAI 통합](../integrations/openai) - OpenAI SDK 자동 래핑
- [LangChain 통합](../integrations/langchain) - LangChain 콜백 핸들러
