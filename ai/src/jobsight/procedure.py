"""
사건 종류별 공통 대응 절차를 그대로 돌려준다.

검색도 생성도 거치지 않는다. 늘 같은 답이라 찾을 이유가 없고,
모델을 거치면 지연이 생기고 문장이 매번 조금씩 달라진다.
"""

from pathlib import Path

import psycopg
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = REPO_ROOT / "ai" / ".env"

load_dotenv(ENV_PATH)

# 3장 "공통 대응 절차 8단계" 의 소항목들이다.
# ingest.py 가 "1단계" ~ "8단계" 를 section 으로 잘라 두었다.
STEP_CHAPTER_KEYWORD = "공통 대응 절차"

SQL = """
    SELECT id, section, page, text, tables, boxes
    FROM chunks
    WHERE kind = %s
      AND chapter LIKE %s
      AND section <> ''
    ORDER BY id
"""


def steps_of(kind):
    """
    사건 종류의 공통 대응 절차를 순서대로 돌려준다.

    id 로 정렬한다. id 가 조각을 만든 순서라서 매뉴얼의 차례와 같다.
    """

    with psycopg.connect() as connection, connection.cursor() as cursor:
        cursor.execute(SQL, (kind, "%" + STEP_CHAPTER_KEYWORD + "%"))
        rows = cursor.fetchall()

    steps = []
    for row in rows:
        steps.append(
            {
                "id": row[0],
                "step": row[1],
                "page": row[2],
                "text": row[3],
                # 표와 네모는 글로 풀면 칸이 사라진다. 구조 그대로 넘긴다.
                "tables": row[4] or [],
                "boxes": row[5] or [],
            }
        )

    return steps


if __name__ == "__main__":
    import sys

    kind = sys.argv[1]

    steps = steps_of(kind)

    print(f"{kind} 공통 대응 절차 — {len(steps)}개")
    print()

    for one in steps:
        print(f"── {one['step']}  ({one['page']}쪽)")
        print(one["text"])
        print()
