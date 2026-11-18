"""
쪽에 그려진 표를 칸째로 읽는다.

표에서 바로 꺼내면 띄어쓰기가 사라지고, 글에서만 꺼내면 어느 칸의
글인지 알 수 없다. 괘선으로 칸 자리를 잡고 그 자리의 낱말을 주워 담는다.
"""

# 같은 줄로 볼 만큼 가까운 높이 차이
LINE_GAP = 5.0

# 낱말 사이가 이보다 좁으면 원래 붙어 있던 글자다
WORD_GAP = 1.2


def inside(rect, x, y):
    """좌표가 그 네모 안에 들어오는가."""

    return rect[0] <= x <= rect[2] and rect[1] <= y <= rect[3]


def group_rows(words):
    """
    낱말을 줄 단위로 묶는다.

    높이를 고정 칸으로 나누면 한 줄이 칸 경계에 걸려 찢어진다.
    가운데 높이가 가까운 것끼리 모은다.
    """

    ordered = []
    for word in words:
        middle = (word[1] + word[3]) / 2
        ordered.append((middle, word[0], word))

    ordered.sort(key=lambda one: (one[0], one[1]))

    rows = []

    for middle, _, word in ordered:
        if rows and abs(middle - rows[-1]["mid"]) <= LINE_GAP:
            rows[-1]["words"].append(word)
        else:
            rows.append({"mid": middle, "words": [word]})

    return rows


def row_text(words):
    """한 줄의 낱말을 글로 잇는다. 원래 붙어 있던 자리는 띄우지 않는다."""

    row = sorted(words, key=lambda one: one[0])

    text = row[0][4]
    right = row[0][2]

    for word in row[1:]:
        if word[0] - right < WORD_GAP:
            text = text + word[4]
        else:
            text = text + " " + word[4]

        if word[2] > right:
            right = word[2]

    return text


def cell_text(page, box):
    """표 한 칸의 자리에 들어 있는 낱말을 주워 글로 만든다."""

    picked = []

    for word in page.get_text("words"):
        cx = (word[0] + word[2]) / 2
        cy = (word[1] + word[3]) / 2

        if inside(box, cx, cy):
            picked.append(word)

    if not picked:
        return ""

    texts = []
    for row in group_rows(picked):
        texts.append(row_text(row["words"]))

    return " ".join(texts)


def tables_of(page):
    """
    쪽에 그려진 표를 찾아 칸 글자까지 채운다.

    괘선만 보고 찾는다. 글자 정렬까지 보는 기본 방식은 왼쪽 체크 목록이
    오른쪽 표와 줄이 맞으면 그것까지 한 표로 묶어 버린다.
    """

    found = []

    for table in page.find_tables(strategy="lines_strict").tables:
        rows = []

        for row in table.rows:
            cells = []
            for box in row.cells:
                cells.append(cell_text(page, box) if box else "")

            if "".join(cells).strip():
                rows.append(cells)

        if rows:
            found.append({"rect": tuple(table.bbox), "rows": rows})

    return found
