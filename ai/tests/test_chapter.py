from jobsight.rag.chapter import group_chapters, is_chapter_start


def page(number, *texts):
    lines = []
    for text in texts:
        lines.append({"text": text, "table": None, "box": None})
    return {"page": number, "lines": lines}


def test_기대한_번호로_시작하면_장이다():
    assert is_chapter_start("3 공통 대응 절차 8단계", 3)


def test_번호가_다르면_장이_아니다():
    assert not is_chapter_start("119 종합상황실", 2)


def test_공백이_없으면_장이_아니다():
    assert not is_chapter_start("4단계", 4)


def test_부록은_번호_없이도_장이다():
    assert is_chapter_start("부록 A", 9)


def test_이어지는_쪽은_앞_장에_붙는다():
    chapters = group_chapters([
        page(1, "1 개요", "목적"),
        page(2, "119 종합상황실"),
        page(3, "2 신고"),
        page(4, "부록 A"),
    ])

    assert [one["title"] for one in chapters] == ["1 개요", "2 신고", "부록 A"]
    assert [one["page"] for one in chapters[0]["lines"]] == [1, 1, 2]


def test_부록_뒤에도_번호는_이어서_센다():
    chapters = group_chapters([
        page(1, "1 개요"),
        page(2, "부록 A"),
        page(3, "2 신고"),
    ])

    assert [one["title"] for one in chapters] == ["1 개요", "부록 A", "2 신고"]
