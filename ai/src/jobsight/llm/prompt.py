"""
모델에게 주는 지시문.

A3 에서 확인했듯 점수로는 "매뉴얼에 없는 질문" 을 가를 수 없다.
그 판단을 이 글이 대신한다. 이 파일이 유일한 방어선이다.
"""

# 모델이 "모르겠다" 고 말할 때 쓰는 문장.
# 프롬프트와 코드가 같은 글자를 봐야 해서 한 곳에 둔다.
# 이 글자가 답에 들어 있으면 answer.py 가 근거를 떼어 낸다.
NOT_FOUND = "매뉴얼에서 찾지 못했습니다"

NEWLINE = chr(10)

# 줄마다 근거를 달게 해 본 적이 있다(2026-11-19). 모델은 시키는 대로 달았지만
# (36개 답 중 32개가 줄 끝에 달았다) 그 번호가 맞는지는 아무도 보증하지 못했다.
# 없는 번호는 걸러도 "있는 번호인데 틀린 것" 은 거를 수 없고, 한 줄에 한 쪽을
# 집어 주면 관제요원이 그것을 믿고 편다. 그래서 근거는 답 단위로만 보여 준다.
SYSTEM_PROMPT = f"""당신은 CCTV 관제센터의 대응 매뉴얼을 찾아 주는 보조원입니다.
관제요원이 급한 상황에서 읽습니다.

1. 주어진 매뉴얼 조각에 있는 내용만으로 답합니다.
2. 조각에 없는 절차·전화번호·기관 이름을 새로 만들지 않습니다.
   관제요원이 근거 없이 움직이면 사고가 납니다.
3. 조각을 그대로 옮겨 적지 않습니다. 질문에 답하는 문장만 씁니다.
4. 조각으로 답할 수 없으면 "{NOT_FOUND}" 라고만 말합니다.
   비슷한 내용으로 둘러대지 않습니다.
5. 질문이 여러 경우를 묻는다면 빠뜨리지 말고 모두 적습니다.
   "어디에 신고하나" 처럼 경우가 나뉘는 질문이 그렇습니다.
6. 할 일이 여럿이면 번호를 붙여 한 줄에 하나씩 적습니다.
7. 질문과 상관없는 내용은 적지 않습니다. 조각에 있어도 마찬가지입니다.
8. 조각 번호나 출처는 적지 않습니다. 화면이 따로 보여 줍니다.
   문장 안에 "조각" 이라는 말을 쓰지 않습니다."""


def box_lines_of(chunk):
    """
    조각에 딸린 색 네모를 줄 목록으로 푼다.

    매뉴얼이 본문과 갈라 둔 칸이라 text 에 섞여 있지 않다. 그런데
    "다친 사람을 옮기지 않도록" 처럼 꼭 지켜야 할 것이 이 칸에 들어 있어서,
    빼고 넘기면 모델이 그 답을 못 하고 못 찾았다고 물러선다.
    """

    lines = []

    for one in chunk.get("boxes") or []:
        lines.append(one["title"])
        for item in one["items"]:
            lines.append(item)

    return lines


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

        for line in box_lines_of(one):
            parts.append(line)

        parts.append(f"</조각 {position + 1}>")
        parts.append("")

    parts.append("위 조각만 보고 아래 질문에 답하십시오.")
    parts.append("")
    parts.append("질문: " + question)

    return NEWLINE.join(parts)
