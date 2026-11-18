"""
쪽을 장 단위로 묶는다.

장은 쪽 첫 줄이 "3 공통 대응 절차 8단계" 처럼 번호로 시작하는지로 알아본다.
번호는 1부터 차례로 늘어난다 — 본문에도 "119 종합상황실" 처럼 숫자로
시작하는 줄이 많아서, 기대한 번호와 다르면 장 제목이 아니라고 본다.
"""


def is_chapter_start(first_line, expected_number):
    """
    쪽의 첫 줄이 새 장의 시작인지 판단한다.

    장 번호는 1부터 차례로 늘어난다. 기대한 번호와 다르면 장 제목이 아니다.
    본문에도 "119 종합상황실"처럼 숫자로 시작하는 줄이 많기 때문이다.
    """

    # 부록은 번호 대신 "부록 A", "부록 B"로 시작한다.
    if first_line.startswith("부록"):
        return True

    # 첫 공백에서 한 번만 나눈다.
    # "3 공통 대응 절차 8단계" -> ["3", "공통 대응 절차 8단계"]
    parts = first_line.split(" ", 1)

    # 공백이 없으면 제목이 아니다. "4단계", "C" 같은 줄이 여기서 걸러진다.
    if len(parts) != 2:
        return False

    number_text = parts[0]

    # isdigit()은 글자가 전부 숫자인지 확인한다.
    if not number_text.isdigit():
        return False

    number = int(number_text)

    # 기대한 번호와 다르면 장 제목이 아니다.
    return number == expected_number


def group_chapters(pages):
    """
    쪽 목록을 장 단위로 묶는다. 장 하나가 여러 쪽에 걸칠 수 있다.

    글자를 그냥 이어 붙이면 쪽 경계가 사라진다. 그러면 6쪽에 있는
    4단계의 출처가 장의 첫 쪽인 5쪽으로 찍힌다.
    그래서 줄마다 어느 쪽에서 왔는지 달고 다닌다.
    """

    chapters = []

    # 지금 모으고 있는 장. 아직 시작 전이라 None으로 둔다.
    current_chapter = None

    # 다음에 와야 할 장 번호
    expected_number = 1

    for one_page in pages:
        # 줄 하나하나에 쪽 번호를 달아 둔다. 표식도 그대로 데리고 간다.
        numbered_lines = []
        for one in one_page["lines"]:
            numbered_lines.append({
                "page": one_page["page"],
                "text": one["text"],
                "table": one["table"],
                "box": one["box"],
            })

        first_line = ""
        for one in numbered_lines:
            if one["text"]:
                first_line = one["text"]
                break

        if is_chapter_start(first_line, expected_number):
            # 새 장이 시작됐다. 앞 장을 목록에 넣는다.
            if current_chapter is not None:
                chapters.append(current_chapter)

            current_chapter = {
                "title": first_line,
                "lines": numbered_lines,
            }

            # 부록은 번호가 없으므로 기대 번호를 올리지 않는다.
            if not first_line.startswith("부록"):
                expected_number = expected_number + 1
        else:
            # 앞 장이 이어지는 쪽이다. 줄을 뒤에 붙인다.
            current_chapter["lines"] = current_chapter["lines"] + numbered_lines

    if current_chapter is not None:
        chapters.append(current_chapter)

    return chapters
