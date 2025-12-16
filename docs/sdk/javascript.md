---
id: javascript
title: JavaScript SDK
sidebar_label: JavaScript SDK
sidebar_position: 3
---

# JavaScript/TypeScript SDK 상세 가이드

## 설치

```bash
npm install langfuse
# 또는
yarn add langfuse
# 또는
pnpm add langfuse
```

## 기본 사용법

### 클라이언트 초기화

```typescript
import Langfuse from "langfuse";

// 환경 변수에서 자동 로드
// LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASEURL
const langfuse = new Langfuse();

// 또는 직접 설정
const langfuse = new Langfuse({
  publicKey: "pk-lf-...",
  secretKey: "sk-lf-...",
  baseUrl: "https://cloud.langfuse.com"
});
```

### 트레이스 생성

```typescript
// 기본 트레이스
const trace = langfuse.trace({ name: "my-trace" });

// 상세 트레이스
const trace = langfuse.trace({
  name: "chat-request",
  userId: "user-123",
  sessionId: "session-abc",
  input: "사용자 질문",
  output: "AI 응답",
  metadata: {
    environment: "production",
    version: "1.0.0"
  },
  tags: ["chatbot", "production"],
  public: false
});
```

### 스팬 사용

```typescript
const trace = langfuse.trace({ name: "process-request" });

// 스팬 생성
const span = trace.span({
  name: "data-preprocessing",
  input: { rawData: "..." },
  metadata: { step: "preprocessing" }
});

// 작업 수행
const processedData = await preprocess(data);

// 스팬 종료
span.end({
  output: { processedData },
  metadata: { recordsProcessed: 100 }
});
```

### 중첩 스팬

```typescript
const trace = langfuse.trace({ name: "complex-task" });

// 부모 스팬
const parentSpan = trace.span({ name: "parent-operation" });

// 자식 스팬
const childSpan = parentSpan.span({ name: "child-operation" });
childSpan.end({ output: "child result" });

// 또 다른 자식
const anotherChild = parentSpan.span({ name: "another-child" });
anotherChild.end({ output: "another result" });

parentSpan.end({ output: "parent result" });
```

### Generation (LLM 호출)

```typescript
import OpenAI from "openai";
import Langfuse from "langfuse";

const openai = new OpenAI();
const langfuse = new Langfuse();

async function chatCompletion(userMessage: string) {
  const trace = langfuse.trace({ name: "llm-request" });

  // Generation 시작
  const generation = trace.generation({
    name: "gpt-4-completion",
    model: "gpt-4",
    modelParameters: {
      temperature: 0.7,
      maxTokens: 1000
    },
    input: [
      { role: "system", content: "당신은 도움이 되는 AI입니다." },
      { role: "user", content: userMessage }
    ]
  });

  try {
    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "당신은 도움이 되는 AI입니다." },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const output = response.choices[0].message.content;

    // Generation 종료
    generation.end({
      output,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens
      },
      metadata: { finishReason: response.choices[0].finish_reason }
    });

    return output;
  } catch (error) {
    generation.end({
      output: error instanceof Error ? error.message : "Unknown error",
      level: "ERROR"
    });
    throw error;
  }
}
```

## 고급 기능

### 스코어 추가

```typescript
const trace = langfuse.trace({ name: "scored-trace" });
const generation = trace.generation({ name: "llm-call", model: "gpt-4" });

// ... 작업 수행 ...

// 트레이스에 스코어 추가
langfuse.score({
  traceId: trace.id,
  name: "user-satisfaction",
  value: 0.9,
  comment: "사용자가 긍정적인 피드백을 남김"
});

// 특정 관찰에 스코어 추가
langfuse.score({
  traceId: trace.id,
  observationId: generation.id,
  name: "response-quality",
  value: 0.85,
  dataType: "NUMERIC"
});

// 카테고리 스코어
langfuse.score({
  traceId: trace.id,
  name: "sentiment",
  value: "positive",
  dataType: "CATEGORICAL"
});
```

### 프롬프트 관리

```typescript
// 프롬프트 가져오기
const prompt = await langfuse.getPrompt("my-prompt");

// 특정 버전 가져오기
const promptV2 = await langfuse.getPrompt("my-prompt", 2);

// 프롬프트 컴파일
const compiled = prompt.compile({
  userName: "홍길동",
  topic: "TypeScript"
});

console.log(compiled);
// "안녕하세요 홍길동님! TypeScript에 대해 설명해드리겠습니다."

// 트레이스에 프롬프트 연결
const trace = langfuse.trace({ name: "prompt-trace" });
const generation = trace.generation({
  name: "completion",
  prompt,  // 프롬프트 연결
  input: compiled
});
```

### 이벤트 기록

```typescript
const trace = langfuse.trace({ name: "event-trace" });

// 이벤트 기록
trace.event({
  name: "user-action",
  input: { action: "button-click", element: "submit-button" }
});

// 에러 이벤트
trace.event({
  name: "error-occurred",
  level: "ERROR",
  input: { errorType: "ValidationError", message: "Invalid input" }
});
```

### 데이터 플러시

```typescript
// 비동기 플러시 (권장)
await langfuse.flushAsync();

// 동기 플러시
langfuse.flush();

// 연결 종료 (애플리케이션 종료 시)
await langfuse.shutdownAsync();
```

## Next.js 통합

### API Route에서 사용

```typescript
// app/api/chat/route.ts
import { NextResponse } from "next/server";
import Langfuse from "langfuse";

const langfuse = new Langfuse();

export async function POST(request: Request) {
  const { message, userId } = await request.json();

  const trace = langfuse.trace({
    name: "chat-api",
    userId
  });

  try {
    const generation = trace.generation({
      name: "chat-completion",
      model: "gpt-4",
      input: message
    });

    // LLM 호출
    const response = await callLLM(message);

    generation.end({ output: response });
    trace.update({ output: response });

    // 응답 전에 플러시
    await langfuse.flushAsync();

    return NextResponse.json({ response });
  } catch (error) {
    trace.update({ level: "ERROR", output: String(error) });
    await langfuse.flushAsync();
    throw error;
  }
}
```

### Server Component에서 사용

```typescript
// app/page.tsx
import Langfuse from "langfuse";

const langfuse = new Langfuse();

export default async function Page() {
  const trace = langfuse.trace({ name: "page-load" });

  const data = await fetchData();

  trace.update({ output: { itemCount: data.length } });
  await langfuse.flushAsync();

  return <div>{/* ... */}</div>;
}
```

## Express.js 통합

```typescript
import express from "express";
import Langfuse from "langfuse";

const app = express();
const langfuse = new Langfuse();

// 미들웨어로 트레이스 추가
app.use((req, res, next) => {
  const trace = langfuse.trace({
    name: "http-request",
    metadata: {
      method: req.method,
      path: req.path,
      userAgent: req.headers["user-agent"]
    }
  });

  // request에 trace 저장
  (req as any).trace = trace;

  // 응답 완료 시 트레이스 종료
  res.on("finish", async () => {
    trace.update({
      output: { statusCode: res.statusCode }
    });
    await langfuse.flushAsync();
  });

  next();
});

app.post("/chat", async (req, res) => {
  const trace = (req as any).trace;

  const generation = trace.generation({
    name: "chat-completion",
    model: "gpt-4",
    input: req.body.message
  });

  const response = await callLLM(req.body.message);

  generation.end({ output: response });

  res.json({ response });
});

// 종료 시 정리
process.on("SIGTERM", async () => {
  await langfuse.shutdownAsync();
  process.exit(0);
});
```

## 전체 예제

```typescript
import Langfuse from "langfuse";
import OpenAI from "openai";

const langfuse = new Langfuse();
const openai = new OpenAI();

interface ChatRequest {
  userId: string;
  sessionId: string;
  message: string;
}

async function processChat(request: ChatRequest): Promise<string> {
  const trace = langfuse.trace({
    name: "chat-processing",
    userId: request.userId,
    sessionId: request.sessionId,
    input: request.message
  });

  try {
    // 전처리
    const preprocessSpan = trace.span({
      name: "preprocessing",
      input: request.message
    });

    const processedMessage = request.message.trim().toLowerCase();

    preprocessSpan.end({
      output: processedMessage
    });

    // LLM 호출
    const generation = trace.generation({
      name: "main-completion",
      model: "gpt-4",
      modelParameters: { temperature: 0.7 },
      input: [{ role: "user", content: processedMessage }]
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: processedMessage }],
      temperature: 0.7
    });

    const output = completion.choices[0].message.content ?? "";

    generation.end({
      output,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens
      }
    });

    // 트레이스 완료
    trace.update({ output });

    return output;
  } catch (error) {
    trace.update({
      level: "ERROR",
      output: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  } finally {
    await langfuse.flushAsync();
  }
}

// 사용
const response = await processChat({
  userId: "user-123",
  sessionId: "session-456",
  message: "TypeScript란 무엇인가요?"
});

console.log(response);
```

## 다음 단계

- [OpenAI 통합](../integrations/openai) - OpenAI SDK 자동 통합
- [LangChain 통합](../integrations/langchain) - LangChain 콜백 핸들러
