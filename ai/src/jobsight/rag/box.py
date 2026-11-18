"""
색을 깐 네모를 찾아 그 안의 줄을 따로 묶는다.

매뉴얼은 꼭 지켜야 할 것과 곁들인 설명을 색 네모에 떼어 둔다.
글로만 꺼내면 어디까지가 네모 안인지 사라져서 앞뒤 문장과 섞인다.
"""

from .table import inside

# 색 네모로 볼 만한 크기. 이보다 작으면 단계 번호표 같은 딱지다.
BOX_MIN_WIDTH = 200.0
BOX_MIN_HEIGHT = 20.0


def boxes_of(page, tables):
    """
    쪽에 깔린 색 네모의 자리를 찾는다.

    표 머리 칸에도 색을 깔았으므로 표 자리와 겹치는 것은 뺀다 —
    표는 table.py 가 이미 칸째로 들고 왔다.
    """

    found = []

    for drawing in page.get_drawings():
        # fill 이 없으면 테두리만 그린 선이다.
        if drawing.get("fill") is None:
            continue

        rect = drawing["rect"]

        if rect.width < BOX_MIN_WIDTH or rect.height < BOX_MIN_HEIGHT:
            continue

        # 쪽 전체에 깐 바탕색은 네모가 아니다.
        if rect.width >= page.rect.width - 1:
            continue

        middle_x = (rect.x0 + rect.x1) / 2
        middle_y = (rect.y0 + rect.y1) / 2

        in_table = False
        for one in tables:
            if inside(one["rect"], middle_x, middle_y):
                in_table = True

        if in_table:
            continue

        found.append((rect.x0, rect.y0, rect.x1, rect.y1))

    return found


def box_at(boxes, y):
    """그 높이가 몇 번째 네모 안인가. 네모 밖이면 None."""

    for position in range(len(boxes)):
        one = boxes[position]
        if one[1] <= y <= one[3]:
            return position

    return None


def fold_boxes(lines):
    """
    네모 안의 줄을 네모 하나로 묶는다.

    첫 줄이 네모의 제목이고 나머지가 항목이다. 묶어 두면 화면이
    테두리를 쳐서 그릴 수 있고, 앞뒤 문장과 섞이지 않는다.
    """

    folded = []
    current = None

    for one in lines:
        if one["table"] is not None or one["box"] is None:
            current = None
            folded.append(one)
            continue

        if current is not None and current["mark"] == one["box"]:
            current["box"]["items"].append(one["text"])
            continue

        current = {
            "y": one["y"],
            "x": one["x"],
            "right": one["right"],
            "text": "",
            "table": None,
            "mark": one["box"],
            "box": {"title": one["text"], "items": []},
        }
        folded.append(current)

    plain = []
    for one in folded:
        plain.append(unfold_alone(one))

    return plain


def unfold_alone(one):
    """
    줄 하나뿐인 네모를 보통 글줄로 되돌린다.

    카드 이름("①건물에서 추락")도 색을 깐 띠 안에 있다. 그것까지 네모로
    치면 이름이 글에서 빠져 나가 카드를 가르는 기호를 찾을 수 없다.
    """

    if one["box"] is None or one["box"]["items"]:
        return one

    plain = dict(one)
    plain["text"] = one["box"]["title"]
    plain["box"] = None

    return plain
