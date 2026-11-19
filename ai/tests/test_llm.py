import json

import pytest

from jobsight.llm import client
from jobsight.llm.prompt import NOT_FOUND, box_lines_of, build_user_prompt


def chunk(similarity=0.5, boxes=None):
    return {
        "id": "fall-03",
        "chapter": "3 공통 대응 절차",
        "section": "1단계",
        "page": 5,
        "text": "본문",
        "boxes": boxes or [],
        "similarity": similarity,
    }


def test_조각을_표시로_감싸고_질문을_마지막에_둔다():
    prompt = build_user_prompt("어디에 신고하나", [chunk()])

    assert prompt.splitlines()[0] == "<조각 1> 3 공통 대응 절차 > 1단계 (5쪽)"
    assert "</조각 1>" in prompt
    assert prompt.endswith("질문: 어디에 신고하나")


def test_네모도_조각에_넣는다():
    boxes = [{"title": "주의", "items": ["옮기지 않는다"]}]

    assert box_lines_of(chunk(boxes=boxes)) == ["주의", "옮기지 않는다"]
    assert "옮기지 않는다" in build_user_prompt("q", [chunk(boxes=boxes)])


def test_네모가_없어도_된다():
    assert box_lines_of({"boxes": None}) == []


@pytest.mark.parametrize(
    ("env", "expected"),
    [
        ("http://vllm:8000/", "http://vllm:8000/v1/chat/completions"),
        ("", client.DEFAULT_URL + "/v1/chat/completions"),
    ],
)
def test_주소를_짠다(monkeypatch, env, expected):
    monkeypatch.setenv("VLLM_URL", env)

    assert client.endpoint_of() == expected


class FakeResponse:
    def __init__(self, body):
        self.body = body

    def read(self):
        return json.dumps(self.body).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_답_글자만_꺼낸다(monkeypatch):
    sent = {}

    def fake_urlopen(request, timeout):
        sent["body"] = json.loads(request.data)
        return FakeResponse({"choices": [{"message": {"content": "119에 신고합니다"}}]})

    monkeypatch.setattr(client.urllib.request, "urlopen", fake_urlopen)

    assert client.ask("시스템", "사용자") == "119에 신고합니다"
    assert sent["body"]["model"] == client.MODEL
    assert [one["role"] for one in sent["body"]["messages"]] == ["system", "user"]


@pytest.fixture
def answer_module(light_import):
    return light_import("jobsight.llm.answer")


def test_쓸_조각이_없으면_모델에_묻지_않는다(monkeypatch, answer_module):
    monkeypatch.setattr(answer_module, "search", lambda q, kind: [chunk(similarity=0.0)])
    monkeypatch.setattr(answer_module, "ask", lambda *args: pytest.fail("모델을 불렀다"))

    result = answer_module.answer("q")

    assert result == {"text": NOT_FOUND + ".", "chunks": []}


def test_점수가_낮은_조각은_넘기지_않는다(monkeypatch, answer_module):
    good = chunk(similarity=answer_module.MIN_SIMILARITY)
    bad = chunk(similarity=answer_module.MIN_SIMILARITY - 0.01)
    monkeypatch.setattr(answer_module, "search", lambda q, kind: [good, bad])
    monkeypatch.setattr(answer_module, "ask", lambda *args: "119에 신고합니다")

    result = answer_module.answer("q", "fall")

    assert result["chunks"] == [good]


def test_못_찾았다고_답하면_근거를_떼어_낸다(monkeypatch, answer_module):
    monkeypatch.setattr(answer_module, "search", lambda q, kind: [chunk()])
    monkeypatch.setattr(answer_module, "ask", lambda *args: NOT_FOUND + ".")

    assert answer_module.answer("q")["chunks"] == []
