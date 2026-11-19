"""
검색 품질을 숫자로 잰다.

eval/questions.json 이 입력이다. search.py 를 그대로 불러 쓰므로
search.py 를 고치면 이 결과도 따라 바뀐다.

    python -m jobsight.rag.evaluate           재서 보여 준다
    python -m jobsight.rag.evaluate --save    지금 숫자를 기준선으로 남긴다
    python -m jobsight.rag.evaluate --check   기준선보다 떨어지면 실패로 끝난다
"""

import json
import sys
from pathlib import Path

from .search import search

REPO_ROOT = Path(__file__).resolve().parents[4]
QUESTIONS_PATH = REPO_ROOT / "ai" / "eval" / "questions.json"
BASELINE_PATH = REPO_ROOT / "ai" / "eval" / "baseline.json"

# 상위 몇 개까지 보고 성공으로 칠지.
TOP_N = 5

# 기준선과 견줄 숫자들. 실패 목록과 점수는 견주지 않는다.
METRICS = ["recall1", "recallN", "mrr"]

# 이만큼은 떨어져도 봐준다. GPU 계산이 같은 점수에서 순위를 뒤집을 때가 있다.
TOLERANCE = 0.01


def report_key(use_kind):
    """기준선 파일에서 그 보고를 찾는 이름."""

    if use_kind:
        return "with_kind"
    return "without_kind"


def numbers_of(report):
    """보고에서 기준선으로 남길 숫자만 꺼낸다."""

    numbers = {}
    for name in METRICS:
        numbers[name] = round(report[name], 3)
    return numbers


def regressions(reports, baseline, tolerance=TOLERANCE):
    """
    기준선보다 떨어진 숫자를 글로 돌려준다. 비어 있으면 통과다.

    오른 것은 문제 삼지 않는다. 오르면 --save 로 기준선을 올려 두면 된다.
    """

    found = []

    for key, report in reports.items():
        before = baseline[key]
        for name in METRICS:
            if report[name] < before[name] - tolerance:
                found.append(f"{key} {name}  {before[name]:.3f} → {report[name]:.3f}")

    return found


def rank_of_answer(results, answers):
    """
    결과에서 정답이 몇 번째로 나오는지 돌려준다. 없으면 0.

    순위는 1부터 센다. 1이면 1위로 맞춘 것이다.
    """

    for position in range(len(results)):
        if results[position]["id"] in answers:
            return position + 1

    return 0


def evaluate(questions, use_kind):
    """질문 목록을 돌려 Recall 과 MRR 을 잰다."""

    hit_at_1 = 0
    hit_at_n = 0
    reciprocal_sum = 0.0
    failures = []
    top_scores = []

    for item in questions:
        # 사건이 떴을 때는 종류를 이미 안다. 그 경우를 따로 재 본다.
        kind = None
        if use_kind:
            kind = item["kind"]

        results = search(item["q"], kind, TOP_N)
        rank = rank_of_answer(results, item["answers"])

        if results:
            top_scores.append(results[0]["similarity"])

        if rank == 1:
            hit_at_1 = hit_at_1 + 1

        if rank > 0:
            hit_at_n = hit_at_n + 1
            # MRR 은 "정답이 몇 번째로 오는지" 를 점수로 바꾼 것이다.
            # 1위면 1.0, 2위면 0.5, 5위면 0.2. 못 찾으면 0.
            reciprocal_sum = reciprocal_sum + 1.0 / rank
        else:
            failures.append((item, results))

    total = len(questions)

    return {
        "recall1": hit_at_1 / total,
        "recallN": hit_at_n / total,
        "mrr": reciprocal_sum / total,
        "failures": failures,
        "top_scores": top_scores,
    }


if __name__ == "__main__":
    data = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    questions = data["positive"]
    negatives = data["negative"]

    print(f"질문 {len(questions)}개로 잰다. 상위 {TOP_N}개까지 본다.")
    print()

    kind_report = None
    reports = {}

    for use_kind in [False, True]:
        if use_kind:
            title = "종류 필터 있음 — 사건이 떴을 때"
        else:
            title = "종류 필터 없음 — 그냥 물을 때"

        report = evaluate(questions, use_kind)
        reports[report_key(use_kind)] = report

        print("=" * 62)
        print(title)
        print(f"  Recall@1   {report['recall1']:.3f}    1위로 맞춘 비율")
        print(
            f"  Recall@{TOP_N}   {report['recallN']:.3f}    상위 {TOP_N}개 안에 든 비율"
        )
        print(f"  MRR        {report['mrr']:.3f}    정답이 얼마나 위에 오는지")
        print()

        # 아래 보고에 쓸 것은 필터 있는 쪽이다. 실제 운영이 그 모양이기 때문이다.
        if use_kind:
            kind_report = report

    print("=" * 62)
    print(f"상위 {TOP_N}개 안에 정답이 없던 질문")
    print()
    for item, results in kind_report["failures"]:
        print(f"  Q  {item['q']}")
        print(f"     기대 {item['answers']}")
        if results:
            got = results[0]
            print(f"     1위 {got['id']} ({got['similarity']:.3f}) {got['chapter']}")
        print()

    print("=" * 62)
    print("임계값 근거")

    positive_scores = sorted(kind_report["top_scores"])
    middle_index = len(positive_scores) // 2
    print(
        f"  매뉴얼 질문 1위 점수  최저 {positive_scores[0]:.3f}"
        f"  중앙 {positive_scores[middle_index]:.3f}"
        f"  최고 {positive_scores[-1]:.3f}"
    )

    negative_scores = []
    for one_question in negatives:
        results = search(one_question, None, 1)
        negative_scores.append(results[0]["similarity"])
    negative_scores.sort()

    print(
        f"  엉뚱한 질문 1위 점수  최저 {negative_scores[0]:.3f}"
        f"  최고 {negative_scores[-1]:.3f}"
    )
    print()

    if negative_scores[-1] < positive_scores[0]:
        middle = (negative_scores[-1] + positive_scores[0]) / 2
        print(
            f"  두 점수대가 겹치지 않는다. MIN_SIMILARITY 를 {middle:.2f} 쯤으로 두면 된다."
        )
    else:
        print("  두 점수대가 겹친다. 고정 임계값 하나로는 가를 수 없다.")

    if "--save" in sys.argv:
        baseline = {}
        for key, report in reports.items():
            baseline[key] = numbers_of(report)

        BASELINE_PATH.write_text(
            json.dumps(baseline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print()
        print(f"기준선을 남겼다 → {BASELINE_PATH}")

    if "--check" in sys.argv:
        print()
        print("=" * 62)

        # 기준선이 없으면 견줄 것이 없다. 통과로 치면 떨어져도 모르고 지나간다.
        if not BASELINE_PATH.exists():
            print(f"기준선이 없다. --save 로 먼저 남겨라 → {BASELINE_PATH}")
            sys.exit(1)

        baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
        dropped = regressions(reports, baseline)

        if dropped:
            print(f"기준선보다 떨어졌다 (봐주는 폭 {TOLERANCE})")
            for one in dropped:
                print("  " + one)
            sys.exit(1)

        print("기준선을 지켰다")
