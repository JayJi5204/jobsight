"""
질문 하나에 답한다. 검색과 생성을 엮는 자리.

rag 는 찾기만 하고 llm 은 만들기만 한다. 둘을 다 아는 것은 여기뿐이다.
"""

import sys

from ..rag.search import MIN_SIMILARITY, search
from .client import ask
from .prompt import NOT_FOUND, SYSTEM_PROMPT, build_user_prompt


def answer(question, kind=None):
    """질문에 답하고, 근거로 쓴 조각도 함께 돌려준다."""

    chunks = search(question, kind)

    # 점수가 바닥인 조각은 아예 넘기지 않는다.
    # 가르는 일은 모델이 하지만, 쓰레기까지 읽힐 이유는 없다.
    usable = []
    for one in chunks:
        if one["similarity"] >= MIN_SIMILARITY:
            usable.append(one)

    if not usable:
        return {"text": NOT_FOUND + ".", "chunks": []}

    user_prompt = build_user_prompt(question, usable)
    text = ask(SYSTEM_PROMPT, user_prompt)

    # 못 찾았다고 답했으면 근거를 붙이지 않는다.
    # "못 찾았습니다" 아래에 쪽 번호가 다섯 개 붙어 있으면
    # 관제요원이 그 쪽을 펴 보고 헛걸음한다.
    if NOT_FOUND in text:
        return {"text": text, "chunks": []}

    return {"text": text, "chunks": usable}


if __name__ == "__main__":
    question = sys.argv[1]

    kind = None
    if len(sys.argv) > 2:
        kind = sys.argv[2]

    result = answer(question, kind)

    print(result["text"])

    # 출처는 모델에게 맡기지 않고 여기서 붙인다.
    # 모델이 없는 번호를 인용하는 일이 없고, 화면에서도 따로 그릴 수 있다.
    if result["chunks"]:
        print()
        print("근거")
        for one in result["chunks"]:
            label = one["chapter"]
            if one["section"]:
                label = label + " > " + one["section"]
            print(f"  {one['page']:>2}쪽  {label}  ({one['similarity']:.3f})")
