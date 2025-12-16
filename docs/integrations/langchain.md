---
id: langchain
title: LangChain 통합
sidebar_label: LangChain
sidebar_position: 3
---

# LangChain 통합

LangChain의 콜백 시스템을 통해 Langfuse와 원활하게 통합할 수 있습니다.

## Python 통합

### 설치

```bash
pip install langfuse langchain langchain-openai
```

### 기본 사용법

```python
from langchain_openai import ChatOpenAI
from langfuse.callback import CallbackHandler

# Langfuse 콜백 핸들러 생성
langfuse_handler = CallbackHandler()

# LangChain 모델에 콜백 추가
llm = ChatOpenAI(model="gpt-4")

response = llm.invoke(
    "안녕하세요!",
    config={"callbacks": [langfuse_handler]}
)

print(response.content)
```

### 콜백 핸들러 설정

```python
from langfuse.callback import CallbackHandler

# 환경 변수에서 자동 로드
handler = CallbackHandler()

# 또는 직접 설정
handler = CallbackHandler(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="https://cloud.langfuse.com",

    # 선택적 설정
    user_id="user-123",
    session_id="session-456",
    trace_name="langchain-trace",
    tags=["production"],
    metadata={"version": "1.0"}
)
```

### 체인 사용

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser
from langfuse.callback import CallbackHandler

# 핸들러 생성
langfuse_handler = CallbackHandler()

# 체인 구성
prompt = ChatPromptTemplate.from_messages([
    ("system", "당신은 {role} 전문가입니다."),
    ("user", "{question}")
])

llm = ChatOpenAI(model="gpt-4")
output_parser = StrOutputParser()

chain = prompt | llm | output_parser

# 체인 실행
result = chain.invoke(
    {"role": "Python", "question": "데코레이터란 무엇인가요?"},
    config={"callbacks": [langfuse_handler]}
)

print(result)
```

### LCEL (LangChain Expression Language)

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langfuse.callback import CallbackHandler

handler = CallbackHandler(
    trace_name="lcel-chain",
    tags=["lcel", "production"]
)

# LCEL 체인
chain = (
    {
        "context": lambda x: get_context(x["question"]),
        "question": RunnablePassthrough()
    }
    | ChatPromptTemplate.from_template(
        "컨텍스트: {context}\n\n질문: {question}\n\n답변:"
    )
    | ChatOpenAI(model="gpt-4")
)

result = chain.invoke(
    {"question": "LangChain이란?"},
    config={"callbacks": [handler]}
)
```

### Agent 사용

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate
from langchain.tools import tool
from langfuse.callback import CallbackHandler

# 도구 정의
@tool
def search(query: str) -> str:
    """검색 도구"""
    return f"'{query}'에 대한 검색 결과입니다."

@tool
def calculator(expression: str) -> str:
    """계산기 도구"""
    return str(eval(expression))

# 핸들러
handler = CallbackHandler(
    trace_name="agent-execution",
    metadata={"agent_type": "openai-tools"}
)

# Agent 생성
llm = ChatOpenAI(model="gpt-4-turbo-preview")
tools = [search, calculator]

prompt = ChatPromptTemplate.from_messages([
    ("system", "당신은 도움이 되는 AI 어시스턴트입니다."),
    ("user", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 실행
result = executor.invoke(
    {"input": "2 + 2는 얼마인가요? 그리고 Python에 대해 검색해주세요."},
    config={"callbacks": [handler]}
)
```

### RAG (Retrieval-Augmented Generation)

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langfuse.callback import CallbackHandler

# 문서 준비
documents = [...]  # 문서 리스트

# 텍스트 분할
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
splits = text_splitter.split_documents(documents)

# 벡터 저장소
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(splits, embeddings)
retriever = vectorstore.as_retriever()

# RAG 체인
prompt = ChatPromptTemplate.from_template("""
다음 컨텍스트를 기반으로 질문에 답변하세요:

컨텍스트: {context}

질문: {question}

답변:
""")

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | ChatOpenAI(model="gpt-4")
)

# Langfuse 핸들러
handler = CallbackHandler(
    trace_name="rag-chain",
    tags=["rag", "qa"]
)

result = chain.invoke(
    "질문 내용",
    config={"callbacks": [handler]}
)
```

### 트레이스 업데이트

실행 중 트레이스 정보를 업데이트:

```python
from langfuse.callback import CallbackHandler

handler = CallbackHandler()

# 체인 실행
result = chain.invoke(input_data, config={"callbacks": [handler]})

# 실행 후 트레이스 업데이트
handler.langfuse.score(
    trace_id=handler.get_trace_id(),
    name="user-feedback",
    value=1
)

# 플러시
handler.langfuse.flush()
```

---

## JavaScript/TypeScript 통합

### 설치

```bash
npm install langfuse langchain @langchain/openai
```

### 기본 사용법

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { CallbackHandler } from "langfuse-langchain";

const handler = new CallbackHandler({
  publicKey: "pk-lf-...",
  secretKey: "sk-lf-..."
});

const llm = new ChatOpenAI({ model: "gpt-4" });

const response = await llm.invoke("Hello!", {
  callbacks: [handler]
});

await handler.flushAsync();
```

### 체인 사용

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { CallbackHandler } from "langfuse-langchain";

const handler = new CallbackHandler({
  traceName: "langchain-chain",
  tags: ["production"]
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a {role} expert."],
  ["user", "{question}"]
]);

const llm = new ChatOpenAI({ model: "gpt-4" });
const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

const result = await chain.invoke(
  { role: "TypeScript", question: "What are generics?" },
  { callbacks: [handler] }
);

await handler.flushAsync();
```

---

## 기록되는 정보

LangChain 통합 시 자동으로 기록되는 정보:

| 항목 | 설명 |
|------|------|
| 체인 구조 | 체인의 각 단계가 스팬으로 기록 |
| LLM 호출 | Generation으로 기록 (모델, 토큰 등) |
| 프롬프트 | 입력 프롬프트 템플릿과 변수 |
| 도구 호출 | Agent의 도구 사용 기록 |
| 검색 결과 | Retriever의 검색 결과 |
| 에러 | 체인 실행 중 발생한 에러 |

## 다음 단계

- [LlamaIndex 통합](./llamaindex) - LlamaIndex 사용
- [OpenAI 통합](./openai) - OpenAI SDK 직접 사용
