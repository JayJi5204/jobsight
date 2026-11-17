"""
RAG 를 HTTP 로 연다.

프론트가 /ai/ 로 부르고 nginx 가 여기로 넘긴다.
모델은 서버가 뜰 때 미리 올린다. 첫 질문이 2GB 로딩을 기다리면 안 된다.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .llm.answer import answer
from .procedure import steps_of
from .rag.search import get_model

# docs/event-contract.md 의 kind 와 같아야 한다.
KINDS = ["fall", "fire", "intrusion", "loitering"]


@asynccontextmanager
async def lifespan(app):
    """서버가 뜰 때 한 번 돈다. 모델을 미리 GPU 에 올린다."""

    get_model()
    yield


app = FastAPI(title="jobsight ai", lifespan=lifespan)


class AskRequest(BaseModel):
    """POST /ask 가 받는 몸통. 타입이 안 맞으면 FastAPI 가 알아서 거른다."""

    question: str
    kind: str | None = None


@app.get("/health")
def health():
    """살아 있는지 확인하는 자리. 컨테이너가 이걸로 상태를 본다."""

    return {"status": "ok"}


@app.get("/procedure/{kind}")
def procedure(kind: str):
    """사건 종류의 공통 대응 절차. 검색도 생성도 거치지 않는다."""

    if kind not in KINDS:
        raise HTTPException(status_code=404, detail="모르는 사건 종류다")

    return {"kind": kind, "steps": steps_of(kind)}


@app.post("/ask")
def ask(request: AskRequest):
    """질문에 답한다. 출처는 모델이 아니라 여기서 붙인다."""

    if request.kind is not None and request.kind not in KINDS:
        raise HTTPException(status_code=400, detail="모르는 사건 종류다")

    result = answer(request.question, request.kind)

    sources = []
    for one in result["chunks"]:
        sources.append(
            {
                "page": one["page"],
                "chapter": one["chapter"],
                "section": one["section"],
                "similarity": round(one["similarity"], 3),
            }
        )

    return {"answer": result["text"], "sources": sources}
