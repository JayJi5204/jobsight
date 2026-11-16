"""
PDF 메뉴얼을 검색에 쓸 수 있는 조각으로 자른다.
A단계: 쪽 하나에서 머리말을 걷어내고 본문만 돌려준다.
"""

import json
from pathlib import Path

import pymupdf

# 이 파일 위치를 기준으로 레포 루트를 찾는다.
# 어느 폴더에서 실행해도 같은 곳을 가리킨다.
# ingest.py -> rag -> jobsight -> src -> ai -> 레포 루트
REPO_ROOT = Path(__file__).resolve().parents[4]
MANUAL_DIF = REPO_ROOT / "manual"
CHUNKS_PATH = REPO_ROOT / "ai" / "chunks" / "chunks.json"


# 쪽마다 맨 앞 두 줄이 쪽번호("3/15")와 머리말("서울시 CCTV")이다.
# 지우지 않으면 모든 조각에 같은 문장이 들어가서,
# 어떤 질문에도 비슷하게 걸리는 쓸모없는 조각이 60개 생긴다.
HEADER_LINE_COUNT = 2

# 1쪽은 표지, 2쪽은 목차라 본문이 아니다.
# 목차는 제목만 나열된 글이라 조각으로 넣으면
# 어떤 질문에도 어중간하게 걸려서 검색을 흐린다.
FIRST_BODY_PAGE = 3

# 임베딩 모델이 한번에 받을 수 있는 글자 수에 한계가 있다(대략 700~1000자)
# 이보다 긴 장만 소항목으로 쪼갠다.
MAX_CHAPTER_CHARS = 2000

# 소제목이 없어 길게 남은 조각을 나누는 기준.
# KoE5 가 한 번에 읽는 길이가 한국어로 700~900자쯤이라, 넘으면 뒤가 잘린다.
MAX_SECTION_CHARS = 800

# 소항목 제목으로 쓰이는 한 글자들
# 대응 카드가 A~F로 나뉘고, 마지막 "+"는 "기타 주의 상황" 칸이다.
SECTION_LETTERS = ["A", "B", "C", "D", "E", "F", "+"]


def page_text(doc, page_index):

    # PyMuPDF는 쪽을 0부터 센다. 3쪽을 보려면 2를 넣어야 한다.
    page = doc[page_index]
    raw_text = page.get_text()

    # 글자 덩어리를 줄 단위로 쪼갠다. 결과는 문자열 목록이다.
    all_lines = raw_text.split("\n")

    # 빈 줄을 먼저 걸러낸다.
    # 이걸 먼저 하지 않으면 "앞 두줄이" 이 머리말이 아닐 수 있다.
    filled_lines = []
    for line in all_lines:
        # strip()은 앞뒤 공백을 떼어낸다.
        # 공백만 있던 줄은 빈 문자열이 되고, 파이썬은 빈 문자열을 거짓으로 친다.
        if line.strip():
            filled_lines.append(line)

    # 앞에서 두 줄을 버리고 나머지만 남긴다.
    body_lines = filled_lines[HEADER_LINE_COUNT:]

    # 남은 줄들을 다시 줄바꿈으로 이어 붙인다.
    body_text = "\n".join(body_lines)

    return body_text


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
        text = page_text(doc, page_index)

        # 쪽 번호를 본문과 함께 들고 다닌다.
        # 나중에 답을 보여줄 때 "5쪽"이라고 출처를 적어야 하기 때문이다.
        one_page = {"page": page_number, "text": text}
        pages.append(one_page)

    return pages


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
    """

    chapters = []

    # 지금 모으고 있는 장. 아직 시작 전이라 None으로 둔다.
    current_chapter = None

    # 다음에 와야 할 장 번호
    expected_number = 1

    for one_page in pages:
        lines = one_page["text"].split("\n")
        first_line = lines[0].strip()

        if is_chapter_start(first_line, expected_number):
            # 새 장이 시작됐다. 앞 장을 목록에 넣는다.
            if current_chapter is not None:
                chapters.append(current_chapter)

            current_chapter = {
                "title": first_line,
                "start_page": one_page["page"],
                "text": one_page["text"],
            }

            # 부록은 번호가 없으므로 기대 번호를 올리지 않는다.
            if not first_line.startswith("부록"):
                expected_number = expected_number + 1
        else:
            # 앞 장이 이어지는 쪽이다. 글자를 뒤에 붙인다.
            current_chapter["text"] = current_chapter["text"] + "\n" + one_page["text"]

    if current_chapter is not None:
        chapters.append(current_chapter)

    return chapters


def is_section_start(line):
    """
    줄이 소항목 제목이면 True. "1단계"나 "A"처럼 짧은 줄이다.
    """
    if line in SECTION_LETTERS:
        return True
    # "1단계" ~ "8단계"만 잡는다.
    # "3단계로 올리는 신호" 같은 줄은 "단계"로 끝나지 않아 걸리지 않는다.
    if line.endswith("단계"):
        number_text = line[:-2]
        if number_text.isdigit():
            return True

    return False


def make_section(chapter, section_title, lines):
    """
    소항목 하나를 딕셔너리로 만든다.
    어느 장에서 나왔는지 같이 들고 간다.
    """

    return {
        "title": chapter["title"],
        "section": section_title,
        "start_page": chapter["start_page"],
        "text": "\n".join(lines),
    }


def split_sections(chapter):
    """
    장 하나를 소항목 목록으로 쪼갠다. 짧은 장은 쪼개지 않는다.
    """

    all_lines = chapter["text"].split("\n")

    if len(chapter["text"]) <= MAX_CHAPTER_CHARS:
        return [make_section(chapter, "", all_lines)]

    sections = []

    # 소제목이 나오기 전의 앞부분도 버리지 않는다. 제목 없는 조각이 된다.
    current_title = ""
    current_lines = []

    for line in all_lines:
        stripped = line.strip()

        if is_section_start(stripped):
            if current_lines:
                sections.append(make_section(chapter, current_title, current_lines))

            current_title = stripped
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections.append(make_section(chapter, current_title, current_lines))

    return sections


def make_part(section, lines, part_number):
    """길이 때문에 나뉜 조각 하나를 만든다. 몇 번째 토막인지 제목에 적는다."""

    section_title = section["section"]

    if section_title:
        section_title = f"{section_title} ({part_number})"
    else:
        section_title = f"({part_number})"

    return {
        "title": section["title"],
        "section": section_title,
        "start_page": section["start_page"],
        "text": "\n".join(lines),
    }


def split_by_length(section):
    """
    소제목이 없어 길게 남은 조각을 줄 경계에서 나눈다.

    줄 가운데를 자르지 않는다. 문장이 끊기면 그 조각만으로는 뜻이 통하지 않는다.
    """

    if len(section["text"]) <= MAX_SECTION_CHARS:
        return [section]

    parts = []
    current_lines = []
    current_length = 0
    part_number = 1

    for line in section["text"].split("\n"):
        # 이 줄을 더하면 한계를 넘고, 이미 모아 둔 게 있으면 거기서 끊는다.
        if current_length + len(line) > MAX_SECTION_CHARS and current_lines:
            parts.append(make_part(section, current_lines, part_number))
            part_number = part_number + 1
            current_lines = []
            current_length = 0

        current_lines.append(line)
        current_length = current_length + len(line)

    # 마지막 토막을 넣는다.
    if current_lines:
        parts.append(make_part(section, current_lines, part_number))

    return parts


def kind_of(pdf_path):
    """
    파일 이름에서 사건 종류를 뽑는다. cctv_fall_manual.pdf -> fall

    이 ㅏㄱㅄ은 docs/event-contract.md의 kind와 글자까지 같아야 한다.
    사건이 떴을 때 그 종류의 조각만 먼저 찾을 수 있어야 하기 떄문이다.
    """

    # stem은 확장자를 뺀 파일 이름이다.
    name = pdf_path.stem
    parts = name.split("_")

    return parts[1]


def build_chunks():
    """
    manual 폴더의 PDF를 전부 읽어 조각 목록으로 만든다.
    """

    chunks = []

    # sorted()로 파일 순서를 고정한다.
    # 순서가 바뀌면 id도 바뀌어서 색인과 어긋난다.
    pdf_paths = sorted(MANUAL_DIF.glob("*.pdf"))

    for pdf_path in pdf_paths:
        kind = kind_of(pdf_path)
        pages = read_pages(pdf_path)
        chapters = group_chapters(pages)

        # 문서마다 1번부터 다시 센다
        order = 0

        for one_chapter in chapters:
            for one_section in split_sections(one_chapter):
                for one_part in split_by_length(one_section):
                    order = order + 1

                    chunk = {
                        "id": f"{kind}-{order:02d}",
                        "kind": kind,
                        "doc": pdf_path.name,
                        "page": one_part["start_page"],
                        "chapter": one_part["title"],
                        "section": one_part["section"],
                        "text": one_part["text"],
                        "n_chars": len(one_part["text"]),
                    }

                    chunks.append(chunk)
    return chunks


def save_chunks(chunks):
    """
    조각 목록을 chunks.json으로 저장한다.
    """

    # chunks 폴더가 없으면 만든다.
    CHUNKS_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(CHUNKS_PATH, "w", encoding="utf-8") as chunks_file:
        # ensure_ascii=False가 없으면 한길이  \uXXXX로 저장돼 눈으로 못 읽는다.
        json.dump(chunks, chunks_file, ensure_ascii=False, indent=2)


# 이 파일을 직접 실행할 떄만 아래가 작동된다.
if __name__ == "__main__":
    # sys.argv는 명령줄에서 받은 값들의 목록이다.
    chunks = build_chunks()
    save_chunks(chunks)

    print(f"조각 수 : {len(chunks)}")
    print(f"저장 : {CHUNKS_PATH}")

    # 종류별로 몇 개씪 나왔는지 센다.
    for kind in ["fall", "fire", "intrusion", "loitering"]:
        count = 0
        for chunk in chunks:
            if chunk["kind"] == kind:
                count = count + 1
        print(f"{kind}: {count}개")

    # 가장 긴 조각과 가장 짧은 조각을 본다.
    longest = 0
    shortest = 999999

    for chunk in chunks:
        longest = max(longest, chunk["n_chars"])
        shortest = min(shortest, chunk["n_chars"])

    print(f"가장 긴 조각: {longest}자")
    print(f"가장 짧은 조각: {shortest}자")
