"""
모델에게 주는 지시문.

A3 에서 확인했듯 점수로는 "매뉴얼에 없는 질문" 을 가를 수 없다.
그 판단을 이 글이 대신한다. 이 파일이 유일한 방어선이다.
"""

SYSTEM_PROMPT = """당신은 CCTV 관제센터의 대응 매뉴얼을 찾아 주는 보조원입니다.
관제요원이 급한 상황에서 읽습니다.

1. 주어진 매뉴얼 조각에 있는 내용만으로 답합니다.
2. 조각에 없는 절차·전화번호·기관 이름을 새로 만들지 않습니다.
   관제요원이 근거 없이 움직이면 사고가 납니다.
3. 조각을 그대로 옮겨 적지 않습니다. 질문에 답하는 문장만 씁니다.
4. 조각으로 답할 수 없으면 "매뉴얼에서 찾지 못했습니다" 라고만 말합니다.
   비슷한 내용으로 둘러대지 않습니다.
5. 질문이 여러 경우를 묻는다면 빠뜨리지 말고 모두 적습니다.
   "어디에 신고하나" 처럼 경우가 나뉘는 질문이 그렇습니다.
6. 할 일이 여럿이면 번호를 붙여 한 줄에 하나씩 적습니다.
7. 질문과 상관없는 내용은 적지 않습니다. 조각에 있어도 마찬가지입니다.
8. 조각 번호나 출처는 적지 않습니다. 화면이 따로 보여 줍니다."""


def build_user_prompt(question, chunks):
    """질문과 찾은 조각을 하나의 글로 묶는다."""

    parts = []

    for position in range(len(chunks)):
        one = chunks[position]

        label = one["chapter"]
        if one["section"]:
            label = label + " > " + one["section"]

        # 조각의 시작과 끝을 표시로 감싼다.
        # 경계가 흐리면 모델이 조각을 답의 형식으로 착각한다.
        parts.append(f"<조각 {position + 1}> {label} ({one['page']}쪽)")
        parts.append(one["text"])
        parts.append(f"</조각 {position + 1}>")
        parts.append("")

    parts.append("위 조각만 보고 아래 질문에 답하십시오.")
    parts.append("")
    parts.append("질문: " + question)

    return "\n".join(parts)
