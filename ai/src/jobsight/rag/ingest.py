"""
매뉴얼 PDF 를 검색과 화면에 쓸 수 있는 조각으로 자른다.

읽는 일은 page.py 가, 가르는 일은 section.py 가 한다.
여기서는 둘을 엮어 조각에 이름표를 붙이고 저장한다.
"""

import json
from pathlib import Path

from .page import read_pages
from .chapter import group_chapters
from .section import split_by_length, split_sections

# 이 파일 위치를 기준으로 레포 루트를 찾는다.
# 어느 폴더에서 실행해도 같은 곳을 가리킨다.
# ingest.py -> rag -> jobsight -> src -> ai -> 레포 루트
REPO_ROOT = Path(__file__).resolve().parents[4]
MANUAL_DIF = REPO_ROOT / "manual"
CHUNKS_PATH = REPO_ROOT / "ai" / "chunks" / "chunks.json"


def kind_of(pdf_path):
    """
    파일 이름에서 사건 종류를 뽑는다. cctv_fall_manual.pdf -> fall

    이 값은 backend 의 EventKind enum 와 글자까지 같아야 한다.
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
                        "page": one_part["page"],
                        "chapter": one_part["title"],
                        "section": one_part["section"],
                        "text": one_part["text"],
                        "tables": one_part["tables"],
                        "boxes": one_part["boxes"],
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
