"""
장 안의 줄을 소항목으로 가른다.

소항목은 "4단계" 나 "①" 같은 짧은 줄로 알아본다.
소제목이 없어 길게 남은 덩어리는 줄 경계에서 나눈다 —
줄 가운데를 자르면 문장이 끊겨 그 조각만으로는 뜻이 통하지 않는다.
"""

# 소제목이 없어 길게 남은 조각을 나누는 기준.
# KoE5 가 한 번에 읽는 길이가 한국어로 700~900자쯤이라, 넘으면 뒤가 잘린다.
MAX_SECTION_CHARS = 800

# 소항목 제목으로 쓰이는 한 글자들
# 대응 카드가 ①~⑥으로 나뉘고, 마지막 ⑦ 은 "기타 주의 상황" 칸이다.
SECTION_LETTERS = ["①", "②", "③", "④", "⑤", "⑥", "⑦"]


def section_title_of(line):
    """
    줄이 소항목 제목이면 그 제목을, 아니면 None 을 돌려준다.

    "A" 처럼 홀로 있을 수도 있고 "A 건물에서 추락" 처럼
    이름과 한 줄에 붙어 있을 수도 있다. 기호만 떼어 제목으로 쓴다.
    """

    if line in SECTION_LETTERS:
        return line

    # "1단계" ~ "8단계"만 잡는다.
    # "3단계로 올리는 신호" 같은 줄은 "단계"로 끝나지 않아 걸리지 않는다.
    if line.endswith("단계"):
        number_text = line[:-2]
        if number_text.isdigit():
            return line

    head = line.split(" ", 1)[0]

    if head in SECTION_LETTERS and len(line) > len(head):
        return head

    # 기호와 이름 사이가 붙어 있을 수도 있다. "①건물에서 추락"
    if len(line) > 1 and line[0] in SECTION_LETTERS:
        return line[0]

    return None


def text_of(numbered_lines):
    """쪽 번호가 달린 줄 목록에서 글자만 꺼내 이어 붙인다."""

    texts = []
    for one in numbered_lines:
        # 표식은 글이 아니다. 표와 네모는 따로 담아 두었다.
        if one.get("table"):
            continue
        if one.get("box"):
            continue
        texts.append(one["text"])

    return "\n".join(texts)


def tables_in(numbered_lines):
    """줄 목록에 끼어 있는 표들을 차례대로 꺼낸다."""

    found = []

    for one in numbered_lines:
        if one.get("table"):
            found.append(one["table"])

    return found


def boxes_in(numbered_lines):
    """
    줄 목록에 끼어 있는 색 네모들을 차례대로 꺼낸다.

    글에 섞지 않는 이유는 매뉴얼이 이것을 떼어 두었기 때문이다.
    섞어 버리면 화면에서 테두리를 칠 수 없고, 네모의 제목이
    앞 문장에 이어지는 말처럼 읽힌다.
    """

    found = []

    for one in numbered_lines:
        if one.get("box"):
            found.append(one["box"])

    return found


def make_section(chapter, section_title, numbered_lines):
    """
    소항목 하나를 딕셔너리로 만든다.

    쪽은 장의 첫 쪽이 아니라 이 소항목의 첫 줄이 있던 쪽이다.
    """

    return {
        "title": chapter["title"],
        "section": section_title,
        "page": numbered_lines[0]["page"],
        "lines": numbered_lines,
        "text": text_of(numbered_lines),
        "tables": tables_in(numbered_lines),
        "boxes": boxes_in(numbered_lines),
    }


def split_sections(chapter):
    """
    장 하나를 소항목 목록으로 쪼갠다.

    길이를 보지 않는다. 전에는 2000자를 넘는 장만 쪼갰는데, 화면이
    1단계~8단계를 따로 받아야 하므로 글자 수가 조금 줄면 단계가
    사라지는 일이 생긴다. 소제목이 있으면 길이와 상관없이 쪼갠다.

    소제목이 없는 장은 제목 없는 한 덩어리로 남는다.
    """

    all_lines = chapter["lines"]

    sections = []

    # 소제목이 나오기 전의 앞부분도 버리지 않는다. 제목 없는 조각이 된다.
    current_title = ""
    current_lines = []

    for one in all_lines:
        stripped = one["text"].strip()

        title = section_title_of(stripped)

        if title is not None:
            if current_lines:
                sections.append(make_section(chapter, current_title, current_lines))

            current_title = title
            current_lines = []

            # "A 건물에서 추락" 처럼 제목 뒤에 이름이 붙어 있으면
            # 그 이름은 본문의 첫 줄로 남긴다. 카드 이름이라 버리면 안 된다.
            rest = stripped[len(title):].strip()
            if rest:
                current_lines.append({
                "page": one["page"],
                "text": rest,
                "table": None,
                "box": None,
            })
        else:
            current_lines.append(one)

    if current_lines:
        sections.append(make_section(chapter, current_title, current_lines))

    return sections


def make_part(section, numbered_lines, part_number):
    """길이 때문에 나뉜 조각 하나를 만든다. 몇 번째 토막인지 제목에 적는다."""

    section_title = section["section"]

    if section_title:
        section_title = f"{section_title} ({part_number})"
    else:
        section_title = f"({part_number})"

    return {
        "title": section["title"],
        "section": section_title,
        "page": numbered_lines[0]["page"],
        "lines": numbered_lines,
        "text": text_of(numbered_lines),
        "tables": tables_in(numbered_lines),
        "boxes": boxes_in(numbered_lines),
    }


def split_by_length(section):
    """
    소제목이 없어 길게 남은 조각을 줄 경계에서 나눈다.

    줄 가운데를 자르지 않는다. 문장이 끊기면 그 조각만으로는 뜻이 통하지 않는다.
    """

    if len(section["text"]) <= MAX_SECTION_CHARS:
        return [section]

    # 먼저 줄을 묶기만 한다. 번호는 나중에 붙인다.
    groups = []
    current_lines = []
    current_length = 0

    for one in section["lines"]:
        line_length = len(one["text"])

        if current_length + line_length > MAX_SECTION_CHARS and current_lines:
            groups.append(current_lines)
            current_lines = []
            current_length = 0

        current_lines.append(one)
        current_length = current_length + line_length

    if current_lines:
        groups.append(current_lines)

    # 한 묶음뿐이면 실제로는 안 쪼개진 것이다.
    # 그런데도 "(1)" 을 붙이면 "(2)" 가 있는 것처럼 보인다.
    if len(groups) == 1:
        return [section]

    parts = []
    for position in range(len(groups)):
        parts.append(make_part(section, groups[position], position + 1))

    return parts
