"""
PDF 쪽 하나를 줄 목록으로 읽는다.

머리말과 쪽번호를 걷어내고, 줄바꿈으로 끊긴 문장을 다시 잇는다.
표와 색 네모는 글로 풀지 않고 구조째로 들고 온다 — 표는 table.py,
네모는 box.py 가 맡고, 여기서는 셋을 한 줄 목록으로 엮는다.
"""

import re

import pymupdf

from .box import box_at, boxes_of, fold_boxes
from .table import LINE_GAP, inside, tables_of

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

# 줄 사이가 이보다 좁으면 자리가 없어 넘어간 같은 문장이다.
# 매뉴얼을 재어 보면 새 항목은 18.8pt 넘게 떨어지고,
# 넘어간 줄은 16.5pt 안쪽이다. 그 사이에 금을 긋는다.
WRAP_GAP = 17.0

# 이보다 긴 줄은 오른쪽 끝까지 찬 줄이다.
# 끝까지 찬 줄 바로 아래의 줄은 넘어온 줄로 본다 —
# 짧게 끝난 줄 아래는 넘어온 줄이 아니라 다음 항목이다.
WIDE_LINE = 300.0


def is_furniture(line):
    """쪽마다 똑같이 들어가는 머리말이나 쪽번호인가."""

    if line.endswith(FOOTER_TAIL):
        return True

    return PAGE_MARK.match(line) is not None


def is_wrapped(before, after):
    """
    뒷줄이 앞줄에서 넘어온 같은 문장인가.

    줄 사이가 좁은 것만으로는 모른다. 카드의 확인 항목들도 16pt 안쪽으로
    붙어 있어서, 그것까지 이으면 서로 다른 항목이 한 문장이 된다.
    그래서 앞줄이 오른쪽 끝까지 찼는지도 본다 — 자리가 남은 채로 끝난
    줄은 넘어간 것이 아니라 거기서 끝난 항목이다.

    같은 네모 안인지도 본다. 네모 안의 글과 밖의 글은 이어지지 않는다.
    """

    gap = after["y"] - before["y"]

    if gap <= LINE_GAP or gap > WRAP_GAP:
        return False

    if before["box"] != after["box"]:
        return False

    return before["right"] - before["x"] >= WIDE_LINE


def join_wrapped(lines):
    """
    자리가 없어 다음 줄로 넘어간 문장을 다시 잇는다.

    이어 붙일 때 띄우지 않는다. 한국어 줄바꿈은 낱말 가운데에서 끊기므로
    띄우면 낱말이 갈라진다.
    """

    joined = []

    for one in lines:
        if one["table"] is not None:
            joined.append(dict(one))
            continue

        if joined and joined[-1]["table"] is None and is_wrapped(joined[-1], one):
            last = joined[-1]
            last["text"] = last["text"] + one["text"]
            last["right"] = one["right"]
            last["y"] = one["y"]
            continue

        joined.append(dict(one))

    return joined


def text_lines_of(page, tables, boxes):
    """쪽의 글줄을 모은다. 표 안의 글은 표 쪽에서 들고 왔으므로 뺀다."""

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

            middle_x = (line["bbox"][0] + line["bbox"][2]) / 2
            middle_y = (line["bbox"][1] + line["bbox"][3]) / 2

            in_table = False
            for one in tables:
                if inside(one["rect"], middle_x, middle_y):
                    in_table = True

            if in_table:
                continue

            # origin 은 글자가 앉는 밑줄선이다. 크기가 달라도 나란한 줄끼리 같다.
            baseline = line["spans"][0]["origin"][1]

            lines.append({
                "y": baseline,
                "x": line["bbox"][0],
                "right": line["bbox"][2],
                "text": text,
                "table": None,
                "box": box_at(boxes, baseline),
            })

    return lines


def page_lines(doc, page_index):
    """쪽 하나를 글줄·표·네모가 제자리에 선 한 목록으로 만든다."""

    # PyMuPDF는 쪽을 0부터 센다. 3쪽을 보려면 2를 넣어야 한다.
    page = doc[page_index]

    tables = tables_of(page)
    boxes = boxes_of(page, tables)

    lines = text_lines_of(page, tables, boxes)

    # 표를 제자리 높이에 표식으로 끼운다.
    for one in tables:
        lines.append({
            "y": one["rect"][1],
            "x": one["rect"][0],
            "right": one["rect"][2],
            "text": "",
            "table": one["rows"],
            "box": None,
        })

    # 밑줄선이 거의 같으면 한 줄이다. 그 안에서는 왼쪽부터 읽는다.
    lines.sort(key=lambda one: (round(one["y"], 1), one["x"]))

    return fold_boxes(join_wrapped(lines))


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
