import pytest

from jobsight.rag.section import (
    MAX_SECTION_CHARS,
    make_section,
    section_title_of,
    split_by_length,
    split_sections,
    text_of,
)


def line(text, page=1, table=None, box=None):
    return {"page": page, "text": text, "table": table, "box": box}


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("①", "①"),
        ("4단계", "4단계"),
        ("① 건물에서 추락", "①"),
        ("①건물에서 추락", "①"),
        ("3단계로 올리는 신호", None),
        ("단계", None),
        ("119 종합상황실", None),
    ],
)
def test_소제목을_알아본다(text, expected):
    assert section_title_of(text) == expected


def test_소제목마다_가르고_앞부분도_남긴다():
    chapter = {
        "title": "3 공통 대응 절차",
        "lines": [
            line("머리글", 5),
            line("1단계", 5),
            line("상황 파악", 5),
            line("2단계", 6),
            line("신고", 6),
        ],
    }

    sections = split_sections(chapter)

    assert [one["section"] for one in sections] == ["", "1단계", "2단계"]
    assert [one["text"] for one in sections] == ["머리글", "상황 파악", "신고"]
    assert sections[2]["page"] == 6


def test_기호_뒤_이름은_본문_첫_줄로_남긴다():
    sections = split_sections({"title": "5 카드", "lines": [line("①건물에서 추락"), line("확인할 것")]})

    assert sections[0]["section"] == "①"
    assert sections[0]["text"] == "건물에서 추락\n확인할 것"


def test_표와_네모는_글에_섞지_않는다():
    table = [["상황", "신고처"]]
    box = {"title": "주의", "items": ["옮기지 않는다"]}

    lines = [line("본문"), line("", table=table), line("", box=box)]
    section = make_section({"title": "장"}, "1단계", lines)

    assert text_of(lines) == "본문"
    assert section["tables"] == [table]
    assert section["boxes"] == [box]


def test_짧은_조각은_나누지_않는다():
    section = make_section({"title": "장"}, "1단계", [line("짧다")])

    assert split_by_length(section) == [section]


def test_긴_조각은_줄_경계에서_나누고_번호를_붙인다():
    long = "가" * (MAX_SECTION_CHARS * 3 // 8)
    lines = [line(long, 1), line(long, 1), line(long, 2), line(long, 2)]
    section = make_section({"title": "장"}, "1단계", lines)

    parts = split_by_length(section)

    assert [one["section"] for one in parts] == ["1단계 (1)", "1단계 (2)"]
    assert [one["page"] for one in parts] == [1, 2]
    for one in parts:
        assert len(one["text"]) <= MAX_SECTION_CHARS
