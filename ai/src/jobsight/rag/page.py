"""
PDF 쪽 하나를 줄 목록으로 읽는다.

머리말과 쪽번호를 걷어내고, 표는 글로 풀지 않고 칸째로 들고 온다.
줄마다 쪽의 어디에 있는지도 비율로 적어 둔다 — 화면이 원문을 띄울 때
그 대목에 형광펜을 칠하는 데 쓴다.
"""

import re

import pymupdf

# 쪽마다 되풀이되는 머리말과 쪽번호다.
# 지우지 않으면 모든 조각에 같은 문장이 들어가서,
# 어떤 질문에도 비슷하게 걸리는 쓸모없는 조각이 60개 생긴다.
#
# 자리로 세지 않는다. 매뉴얼을 다시 짜면 글 차례가 달라져
# 앞 두 줄이 머리말이 아닐 수 있다. 생김새로 알아본다.
FOOTER_TAIL = "초안 v0.1"
PAGE_MARK = re.compile(r"^\d+\s*/\s*\d+$")

# 1쪽은 표지, 2쪽은 목차라 본문이 아니다.
# 목차는 제목만 나열된 글이라 조각으로 넣으면
# 어떤 질문에도 어중간하게 걸려서 검색을 흐린다.
FIRST_BODY_PAGE = 3

# 같은 줄로 볼 만큼 가까운 높이 차이
LINE_GAP = 5.0

# 낱말 사이가 이보다 좁으면 원래 붙어 있던 글자다
WORD_GAP = 1.2


def is_furniture(line):
    """쪽마다 똑같이 들어가는 머리말이나 쪽번호인가."""

    if line.endswith(FOOTER_TAIL):
        return True

    return PAGE_MARK.match(line) is not None


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
    """
    표 한 칸의 글을 읽는다.

    표에서 바로 꺼내면 띄어쓰기가 사라지고, 글에서만 꺼내면
    어느 칸의 글인지 알 수 없다. 좌표로 둘을 합쳐야 제대로 나온다.
    """

    picked = []

    for word in page.get_text("words"):
        cx = (word[0] + word[2]) / 2
        cy = (word[1] + word[3]) / 2

        if box[0] <= cx <= box[2] and box[1] <= cy <= box[3]:
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


def page_lines(doc, page_index):

    # PyMuPDF는 쪽을 0부터 센다. 3쪽을 보려면 2를 넣어야 한다.
    page = doc[page_index]

    tables = tables_of(page)

    lines = []

    for block in page.get_text("dict")["blocks"]:
        # type 0 이 글자 덩어리다. 그림은 건너뛴다.
        if block["type"] != 0:
            continue

        for line in block["lines"]:
            text = ""
            for span in line["spans"]:
                text = text + span["text"]

            text = text.strip()

            if not text:
                continue

            if is_furniture(text):
                continue

            left = (line["bbox"][0] + line["bbox"][2]) / 2
            middle = (line["bbox"][1] + line["bbox"][3]) / 2

            # 표 안의 글은 빼낸다. 표 쪽에서 칸째로 들고 왔다.
            inside = False
            for one in tables:
                rect = one["rect"]
                if rect[0] <= left <= rect[2] and rect[1] <= middle <= rect[3]:
                    inside = True

            if inside:
                continue

            # origin 은 글자가 앉는 밑줄선이다. 크기가 달라도 나란한 줄끼리 같다.
            lines.append({
                "y": line["spans"][0]["origin"][1],
                "x": line["bbox"][0],
                "text": text,
                "table": None,
            })

    # 표를 제자리 높이에 표식으로 끼운다.
    for one in tables:
        lines.append({
            "y": one["rect"][1],
            "x": one["rect"][0],
            "text": "",
            "table": one["rows"],
        })

    # 밑줄선이 거의 같으면 한 줄이다. 그 안에서는 왼쪽부터 읽는다.
    lines.sort(key=lambda one: (round(one["y"], 1), one["x"]))

    return lines


def read_pages(pdf_path):
    """
    PDF 한개를 읽어 쪽마다 쪽번호와 본문을 담은 목록을 돌려준다.
    """

    doc = pymupdf.open(pdf_path)

    pages = []

    # range(a,b)는 a부터 b-1까지의 숫자를 차례로 준다.
    # 사람이 세는 쪽 번호 (3부터)로 돌면서, 안에서 1을 뺴 PyMuPDF 번호로 바꾼다.
    for page_number in range(FIRST_BODY_PAGE, doc.page_count + 1):
        page_index = page_number - 1
        lines = page_lines(doc, page_index)

        # 쪽 번호를 본문과 함께 들고 다닌다.
        # 나중에 답을 보여줄 때 "5쪽"이라고 출처를 적어야 하기 때문이다.
        one_page = {"page": page_number, "lines": lines}
        pages.append(one_page)

    return pages
