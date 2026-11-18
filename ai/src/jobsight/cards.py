"""
사건 종류별 유형 대응 카드를 그대로 돌려준다.

매뉴얼 5장이다. 공통 절차를 따르면서 그 유형에서 더 확인하고
말해야 할 것을 적어 둔 칸이다. 절차와 마찬가지로 늘 같은 내용이라
검색도 생성도 거치지 않는다.
"""

from pathlib import Path

import psycopg
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = REPO_ROOT / "ai" / ".env"

load_dotenv(ENV_PATH)

# 5장 "○○ 유형별 대응 카드" 의 소항목들이다.
# ingest.py 가 카드 기호(①~⑦)를 section 으로 잘라 두었다.
CARD_CHAPTER_KEYWORD = "유형별 대응 카드"

SQL = """
    SELECT id, section, page, text, tables
    FROM chunks
    WHERE kind = %s
      AND chapter LIKE %s
      AND section <> \'\'
    ORDER BY id
"""


def cards_of(kind):
    """그 종류의 유형 카드를 매뉴얼 차례대로 돌려준다."""

    with psycopg.connect() as connection, connection.cursor() as cursor:
        cursor.execute(SQL, (kind, "%" + CARD_CHAPTER_KEYWORD + "%"))
        rows = cursor.fetchall()

    cards = []

    for row in rows:
        text = row[3]

        # 첫 줄이 카드 이름이다. 나머지가 본문이다.
        head, _, body = text.partition("\n")

        cards.append(
            {
                "id": row[0],
                "mark_no": row[1],
                "name": head,
                "page": row[2],
                "text": body,
                "tables": row[4] or [],
            }
        )

    return cards


if __name__ == "__main__":
    import sys

    kind = sys.argv[1]

    for one in cards_of(kind):
        print(one["mark_no"], one["name"], "—", one["page"], "쪽")
