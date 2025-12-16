---
id: llamaindex
title: LlamaIndex 통합
sidebar_label: LlamaIndex
sidebar_position: 4
---

# LlamaIndex 통합

LlamaIndex와 Langfuse를 통합하여 RAG 파이프라인과 인덱싱 작업을 추적할 수 있습니다.

## 설치

```bash
pip install langfuse llama-index llama-index-callbacks-langfuse
```

## 기본 사용법

### 콜백 핸들러 설정

```python
from llama_index.core import Settings
from llama_index.core.callbacks import CallbackManager
from langfuse.llama_index import LlamaIndexCallbackHandler

# Langfuse 콜백 핸들러 생성
langfuse_handler = LlamaIndexCallbackHandler()

# 전역 설정에 콜백 추가
Settings.callback_manager = CallbackManager([langfuse_handler])
```

### 간단한 쿼리

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.core import Settings
from llama_index.core.callbacks import CallbackManager
from langfuse.llama_index import LlamaIndexCallbackHandler

# 콜백 설정
langfuse_handler = LlamaIndexCallbackHandler(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="https://cloud.langfuse.com"
)
Settings.callback_manager = CallbackManager([langfuse_handler])

# 문서 로드 및 인덱스 생성
documents = SimpleDirectoryReader("data").load_data()
index = VectorStoreIndex.from_documents(documents)

# 쿼리 엔진 생성 및 쿼리
query_engine = index.as_query_engine()
response = query_engine.query("문서의 주요 내용은 무엇인가요?")

print(response)
```

### 트레이스 메타데이터 설정

```python
from langfuse.llama_index import LlamaIndexCallbackHandler

handler = LlamaIndexCallbackHandler(
    # 기본 설정
    public_key="pk-lf-...",
    secret_key="sk-lf-...",

    # 트레이스 메타데이터
    trace_name="llamaindex-rag",
    user_id="user-123",
    session_id="session-456",
    tags=["rag", "production"],
    metadata={"version": "1.0", "index_type": "vector"}
)
```

## RAG 파이프라인

### 기본 RAG

```python
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
    StorageContext,
    load_index_from_storage
)
from llama_index.core.callbacks import CallbackManager
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from langfuse.llama_index import LlamaIndexCallbackHandler

# 콜백 설정
langfuse_handler = LlamaIndexCallbackHandler(
    trace_name="rag-pipeline"
)
Settings.callback_manager = CallbackManager([langfuse_handler])

# LLM 및 임베딩 설정
Settings.llm = OpenAI(model="gpt-4", temperature=0.1)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

# 문서 로드
documents = SimpleDirectoryReader(
    input_dir="./data",
    recursive=True
).load_data()

# 인덱스 생성
index = VectorStoreIndex.from_documents(
    documents,
    show_progress=True
)

# 쿼리 엔진
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="tree_summarize"
)

# 쿼리 실행
response = query_engine.query("주요 기능에 대해 설명해주세요.")
print(response)

# 플러시
langfuse_handler.flush()
```

### 고급 RAG 설정

```python
from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.callbacks import CallbackManager
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from langfuse.llama_index import LlamaIndexCallbackHandler

# 콜백 설정
langfuse_handler = LlamaIndexCallbackHandler(
    trace_name="advanced-rag",
    metadata={"retriever": "vector", "postprocessor": "similarity"}
)
Settings.callback_manager = CallbackManager([langfuse_handler])

# 인덱스 로드 (이미 생성된 경우)
index = load_existing_index()

# 커스텀 리트리버
retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=10
)

# 포스트프로세서
postprocessors = [
    SimilarityPostprocessor(similarity_cutoff=0.7)
]

# 쿼리 엔진 구성
query_engine = RetrieverQueryEngine(
    retriever=retriever,
    node_postprocessors=postprocessors
)

response = query_engine.query("질문")
```

## Chat Engine

```python
from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.callbacks import CallbackManager
from langfuse.llama_index import LlamaIndexCallbackHandler

# 콜백 설정
langfuse_handler = LlamaIndexCallbackHandler(
    trace_name="chat-engine",
    session_id="chat-session-123"
)
Settings.callback_manager = CallbackManager([langfuse_handler])

# 인덱스 및 챗 엔진
index = VectorStoreIndex.from_documents(documents)
chat_engine = index.as_chat_engine(
    chat_mode="context",
    system_prompt="당신은 친절한 AI 어시스턴트입니다."
)

# 대화
response1 = chat_engine.chat("안녕하세요!")
print(response1)

response2 = chat_engine.chat("이전 대화 내용을 기억하나요?")
print(response2)

# 대화 리셋
chat_engine.reset()
```

## Agent 사용

```python
from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.callbacks import CallbackManager
from llama_index.core.tools import QueryEngineTool
from llama_index.agent.openai import OpenAIAgent
from langfuse.llama_index import LlamaIndexCallbackHandler

# 콜백 설정
langfuse_handler = LlamaIndexCallbackHandler(
    trace_name="agent-execution"
)
Settings.callback_manager = CallbackManager([langfuse_handler])

# 도구 생성
index = VectorStoreIndex.from_documents(documents)
query_tool = QueryEngineTool.from_defaults(
    query_engine=index.as_query_engine(),
    name="document_qa",
    description="문서에 대한 질문에 답변합니다."
)

# Agent 생성
agent = OpenAIAgent.from_tools(
    tools=[query_tool],
    verbose=True
)

# Agent 실행
response = agent.chat("문서에서 주요 개념을 찾아주세요.")
print(response)
```

## 스코어 추가

```python
from langfuse.llama_index import LlamaIndexCallbackHandler

handler = LlamaIndexCallbackHandler()

# 쿼리 실행
response = query_engine.query("질문")

# 스코어 추가
handler.langfuse.score(
    trace_id=handler.get_trace_id(),
    name="relevance",
    value=0.9,
    comment="관련성 높은 응답"
)

handler.flush()
```

## 기록되는 정보

| 항목 | 설명 |
|------|------|
| 인덱싱 | 문서 인덱싱 과정 |
| 임베딩 | 임베딩 생성 호출 |
| 검색 | 리트리버 검색 결과 |
| LLM 호출 | Generation으로 기록 |
| 후처리 | 노드 포스트프로세서 |
| 응답 합성 | 최종 응답 생성 과정 |

## 다음 단계

- [LangChain 통합](./langchain) - LangChain 사용
- [OpenAI 통합](./openai) - OpenAI SDK 직접 사용
