import pytest


@pytest.fixture
def evaluate(light_import):
    return light_import("jobsight.rag.evaluate")


def test_정답이_몇_번째인지_센다(evaluate):
    results = [{"id": "fall-01"}, {"id": "fall-08"}, {"id": "fall-03"}]

    assert evaluate.rank_of_answer(results, ["fall-03", "fall-08"]) == 2
    assert evaluate.rank_of_answer(results, ["fire-01"]) == 0


def test_리콜과_MRR을_잰다(monkeypatch, evaluate):
    ranked = {
        "1위": [{"id": "a", "similarity": 0.9}],
        "2위": [{"id": "x", "similarity": 0.8}, {"id": "a", "similarity": 0.7}],
        "없음": [{"id": "x", "similarity": 0.3}],
    }
    monkeypatch.setattr(evaluate, "search", lambda q, kind, top_n: ranked[q])

    questions = [{"q": q, "kind": "fall", "answers": ["a"]} for q in ranked]
    report = evaluate.evaluate(questions, use_kind=True)

    assert report["recall1"] == pytest.approx(1 / 3)
    assert report["recallN"] == pytest.approx(2 / 3)
    assert report["mrr"] == pytest.approx((1 + 0.5) / 3)
    assert [item["q"] for item, _ in report["failures"]] == ["없음"]


def baseline_of(value):
    one = {"recall1": value, "recallN": value, "mrr": value}
    return {"with_kind": dict(one), "without_kind": dict(one)}


def test_기준선을_지키면_통과다(evaluate):
    assert evaluate.regressions(baseline_of(0.8), baseline_of(0.8)) == []


def test_봐주는_폭_안에서_떨어지면_통과다(evaluate):
    assert evaluate.regressions(baseline_of(0.795), baseline_of(0.8)) == []


def test_기준선보다_떨어지면_무엇이_떨어졌는지_알려_준다(evaluate):
    now = baseline_of(0.8)
    now["with_kind"]["mrr"] = 0.7

    dropped = evaluate.regressions(now, baseline_of(0.8))

    assert dropped == ["with_kind mrr  0.800 → 0.700"]


def test_오른_것은_문제_삼지_않는다(evaluate):
    assert evaluate.regressions(baseline_of(0.9), baseline_of(0.8)) == []


def test_기준선에는_숫자만_남긴다(evaluate):
    report = {"recall1": 0.81234, "recallN": 0.9, "mrr": 0.85, "failures": [], "top_scores": []}

    assert evaluate.numbers_of(report) == {"recall1": 0.812, "recallN": 0.9, "mrr": 0.85}
