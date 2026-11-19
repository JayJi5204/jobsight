from jobsight.rag.box import box_at, fold_boxes
from jobsight.rag.table import group_rows, inside, row_text


def word(x0, y0, x1, y1, text):
    return (x0, y0, x1, y1, text)


def test_네모_안을_알아본다():
    assert inside((0, 0, 10, 10), 5, 5)
    assert not inside((0, 0, 10, 10), 11, 5)


def test_가운데_높이가_가까우면_같은_줄이다():
    rows = group_rows([
        word(0, 0, 10, 10, "가"),
        word(20, 3, 30, 13, "나"),
        word(0, 30, 10, 40, "다"),
    ])

    assert [[one[4] for one in row["words"]] for row in rows] == [["가", "나"], ["다"]]


def test_붙어_있던_글자는_띄우지_않는다():
    text = row_text([
        word(25, 0, 45, 10, "하세요"),
        word(0, 0, 10, 10, "안"),
        word(10.5, 0, 20, 10, "녕"),
    ])

    assert text == "안녕 하세요"


def test_높이로_몇_번째_네모인지_찾는다():
    boxes = [(0, 10, 100, 50), (0, 60, 100, 90)]

    assert box_at(boxes, 70) == 1
    assert box_at(boxes, 55) is None


def plain(text, box=None):
    return {"y": 0, "x": 0, "right": 100, "text": text, "table": None, "box": box}


def test_네모_안의_줄을_제목과_항목으로_묶는다():
    folded = fold_boxes([
        plain("앞글"),
        plain("주의", box=0),
        plain("옮기지 않는다", box=0),
        plain("뒷글"),
    ])

    assert [one["text"] for one in folded] == ["앞글", "", "뒷글"]
    assert folded[1]["box"] == {"title": "주의", "items": ["옮기지 않는다"]}


def test_줄_하나뿐인_네모는_보통_글로_되돌린다():
    folded = fold_boxes([plain("①건물에서 추락", box=0), plain("본문")])

    assert folded[0]["text"] == "①건물에서 추락"
    assert folded[0]["box"] is None
