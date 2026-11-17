"""
질문 하나로 매뉴얼 조각을 찾는다.

index.py 가 채운 chunks 테이블이 입력이다.
"""

from pathlib import Path

import psycopg
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

REPO_ROOT = Path(__file__).resolve().parents[4]
ENV_PATH = REPO_ROOT / "ai" / ".env"

# 색인할 때와 같은 모델이어야 한다. 다른 모델로 찾으면 좌표계가 달라 아무것도 못 찾는다.
MODEL_NAME = "nlpai-lab/KoE5"

# 질문에는 "query: ", 문서에는 "passage: " 를 붙인다. index.py 와 짝이다.
QUERY_PREFIX = "query: "

# ─── 아래 두 숫자가 운영 판단이다. A3-3 에서 재 보고 정한다 ───

# 몇 개를 가져와 LLM 에 넘길지. 많으면 맥락이 늘지만 엉뚱한 것도 섞인다.
TOP_K = 5

# 이 점수 아래면 "매뉴얼에 없다" 로 본다.
# 지금은 임시값이다. 질문 형태에 따라 점수대가 달라서 그대로 두면 위험하다.
MIN_SIMILARITY = 0.20

load_dotenv(ENV_PATH)

# 모델을 담아 두는 자리. 처음 쓸 때 한 번만 채운다.
_model = None


def get_model():
    """
    모델은 한 번만 GPU 에 올린다.

    질문마다 새로 올리면 2GB 를 매번 다시 읽어서 몇 초씩 걸린다.
    """

    # global 은 "함수 밖의 _model 을 바꾸겠다" 는 선언이다.
    # 이게 없으면 파이썬은 함수 안에 새 변수를 만들어 버린다.
    global _model

    if _model is None:
        _model = SentenceTransformer(MODEL_NAME, device="cuda")

    return _model


def to_vector_text(vector):
    """숫자 목록을 pgvector 가 읽는 글자 모양으로 바꾼다. index.py 와 같은 방식이다."""

    numbers = []
    for value in vector:
        numbers.append(str(float(value)))

    return "[" + ",".join(numbers) + "]"


def search(question, kind=None, top_k=TOP_K):
    """
    질문과 가까운 조각을 가까운 순서대로 돌려준다.

    kind 를 주면 그 종류의 문서 안에서만 찾는다.
    사건이 떴을 때는 종류를 이미 알고 있으므로 그때 쓴다.
    """

    model = get_model()

    vector = model.encode([QUERY_PREFIX + question], normalize_embeddings=True)[0]
    vector_text = to_vector_text(vector)

    # 1 - 거리 = 유사도. 사람이 읽기 좋은 쪽으로 되돌린다.
    sql = """
        SELECT id, kind, page, chapter, section, text,
               1 - (embedding <=> %s::vector)
        FROM chunks
    """
    params = [vector_text]

    if kind is not None:
        sql = sql + " WHERE kind = %s"
        params.append(kind)

    sql = sql + " ORDER BY embedding <=> %s::vector LIMIT %s"
    params.append(vector_text)
    params.append(top_k)

    with psycopg.connect() as connection, connection.cursor() as cursor:
        cursor.execute(sql, params)
        rows = cursor.fetchall()

    results = []
    for row in rows:
        results.append(
            {
                "id": row[0],
                "kind": row[1],
                "page": row[2],
                "chapter": row[3],
                "section": row[4],
                "text": row[5],
                "similarity": row[6],
            }
        )

    return results


if __name__ == "__main__":
    import sys

    question = sys.argv[1]

    kind = None
    if len(sys.argv) > 2:
        kind = sys.argv[2]

    for one in search(question, kind):
        label = one["chapter"]
        if one["section"]:
            label = label + " > " + one["section"]

        print(f"{one['similarity']:.3f}  [{one['kind']}] {label}")
        print(f"        {one['text'][:70]}")
        print()
