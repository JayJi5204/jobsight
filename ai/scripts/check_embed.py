import torch
from sentence_transformers import SentenceTransformer

MODEL_NAME = "nlpai-lab/KoE5"

print("모델을 불러온다. 처음이면 2GB 를 내려받는다...")
model = SentenceTransformer(MODEL_NAME, device="cuda")

# E5 계열 모델은 접두어를 반드시 붙여야 한다.
# 질문에는 "query: ", 문서에는 "passage: " 를 붙인다.
# 이 모델이 그렇게 학습돼서, 빠뜨리면 검색 성능이 눈에 띄게 떨어진다.
question = "query: 추락한 사람을 발견하면 어디에 신고하나요"
right = (
    "passage: 신고 - 사람이 떨어짐·다침은 119, 투신 시도는 112와 119 모두에 신고한다"
)
wrong = "passage: 영상 보존 - 원인 조사에 쓸 영상을 지키고 함부로 보지 않는다"

# normalize_embeddings=True 로 길이를 1로 맞춘다.
# 그러면 두 벡터의 내적이 곧 코사인 유사도가 된다.
vectors = model.encode([question, right, wrong], normalize_embeddings=True)

print(f"벡터 차원: {vectors.shape}")

similarity_right = float(vectors[0] @ vectors[1])
similarity_wrong = float(vectors[0] @ vectors[2])

print(f"맞는 조각과의 유사도  : {similarity_right:.4f}")
print(f"엉뚱한 조각과의 유사도: {similarity_wrong:.4f}")

used_mb = torch.cuda.max_memory_allocated() / 1024 / 1024
print(f"GPU 사용: {used_mb:.0f}MB")
