"""
chunks.json 의 조각을 벡터로 바꿔 Postgres(pgvector)에 저장한다.

ingest.py 가 만든 chunks.json 이 입력이고, chunks 테이블이 산출물이다.
"""

import json
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

REPO_ROOT = Path(__file__).resolve().parents[4]
CHUNKS_PATH = REPO_ROOT / "ai" / "chunks" / "chunks.json"
ENV_PATH = REPO_ROOT / "ai" / ".env"

# KoE5 는 multilingual-e5 계열이라 접두어가 필요하다.
# 문서에는 "passage: ", 질문에는 "query: " 를 붙인다.
# 이 모델이 그렇게 학습돼서, 빠뜨리면 검색 성능이 눈에 띄게 떨어진다.
MODEL_NAME = "nlpai-lab/KoE5"
DOC_PREFIX = "passage: "

# 줄바꿈 글자
NEWLINE = chr(10)

# GPU 1 은 kanana 가 27GB 를 쓰고 있어 5GB 남짓만 남는다.
# 배치를 크게 잡으면 메모리가 모자란다. 조각이 113개뿐이라 작아도 금방 끝난다.
BATCH_SIZE = 16

# backend 의 EventKind enum 의 kind 를 사람이 읽는 말로 바꾼다.
KIND_LABELS = {
    "fall": "추락",
    "fire": "화재",
    "intrusion": "침입",
    "loitering": "배회",
}


def load_chunks():
    """ingest.py 가 만든 조각 목록을 읽는다."""

    text = CHUNKS_PATH.read_text(encoding="utf-8")
    return json.loads(text)


def embed_text_of(chunk):
    """
    임베딩에 넣을 글을 만든다. 본문 앞에 어디서 나온 조각인지 머리를 붙인다.

    "4단계" 만 적힌 조각은 무슨 문서의 4단계인지 알 수 없다.
    머리를 붙이면 조각 하나만 읽어도 맥락이 산다.
    """

    label = KIND_LABELS[chunk["kind"]]

    head = f"[{label}] {chunk['chapter']}"

    if chunk["section"]:
        head = head + " > " + chunk["section"]

    return DOC_PREFIX + head + NEWLINE + chunk["text"] + box_text_of(chunk)


def box_text_of(chunk):
    """
    색 네모의 글을 찾기용으로 이어 붙인다.

    보여 줄 때는 네모를 따로 그려야 해서 text 에 섞지 않았다. 그렇다고
    벡터에서도 빠지면 "다친 사람을 옮겨도 되나" 같은 물음이 그 네모에
    닿지 못한다. 저장하는 글은 그대로 두고 벡터에만 더해 둔다.
    """

    texts = []

    for one in chunk["boxes"]:
        texts.append(one["title"])
        for item in one["items"]:
            texts.append(item)

    if not texts:
        return ""

    return NEWLINE + NEWLINE.join(texts)


def to_vector_text(vector):
    """
    숫자 목록을 pgvector 가 읽는 글자 모양으로 바꾼다. "[0.12,-0.34,...]"

    psycopg 는 파이썬 목록을 vector 타입으로 바로 넘기지 못한다.
    글자로 만들어 넘기고 SQL 에서 ::vector 로 변환한다.
    """

    numbers = []
    for value in vector:
        numbers.append(str(float(value)))

    return "[" + ",".join(numbers) + "]"


if __name__ == "__main__":
    # .env 의 PGHOST, PGUSER 같은 값을 환경변수로 올린다.
    # psycopg 가 그 이름들을 스스로 읽으므로 접속 문자열을 적을 필요가 없다.
    load_dotenv(ENV_PATH)

    chunks = load_chunks()
    print(f"조각 {len(chunks)}개를 읽었다.")

    print("모델을 불러온다...")
    model = SentenceTransformer(MODEL_NAME, device="cuda")

    embed_texts = []
    for chunk in chunks:
        embed_texts.append(embed_text_of(chunk))

    print("벡터로 바꾸는 중...")
    vectors = model.encode(
        embed_texts,
        batch_size=BATCH_SIZE,
        normalize_embeddings=True,
        show_progress_bar=True,
    )

    print("저장하는 중...")
    with psycopg.connect() as connection, connection.cursor() as cursor:
        # 다시 색인할 때 예전 행이 남아 있으면 같은 조각이 두 번 걸린다.
        cursor.execute("TRUNCATE chunks")

        for position in range(len(chunks)):
            chunk = chunks[position]
            vector = vectors[position]

            # 저장하는 글은 머리를 뺀 원문이다.
            # 사람에게 보여 주고 LLM 에 넘길 것은 원문이기 때문이다.
            cursor.execute(
                """
                    INSERT INTO chunks
                        (id, kind, doc, page, chapter, section, text, tables, boxes, embedding)
                    VALUES
                        (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::vector)
                    """,
                (
                    chunk["id"],
                    chunk["kind"],
                    chunk["doc"],
                    chunk["page"],
                    chunk["chapter"],
                    chunk["section"],
                    chunk["text"],
                    # 표와 네모는 글이 아니라 구조다. jsonb 로 그대로 둔다.
                    json.dumps(chunk["tables"], ensure_ascii=False),
                    json.dumps(chunk["boxes"], ensure_ascii=False),
                    to_vector_text(vector),
                ),
            )

        cursor.execute("SELECT count(*) FROM chunks")
        saved_count = cursor.fetchone()[0]

    print(f"저장 완료: {saved_count}개")
