"""
vLLM(kanana)에 물어보고 답을 받는다.

vLLM 은 OpenAI 와 같은 모양의 주소를 낸다.
모델을 바꿔도 아래 ENDPOINT 와 MODEL 만 고치면 된다.
"""

import json
import urllib.request

ENDPOINT = "http://127.0.0.1:8001/v1/chat/completions"
MODEL = "kanana"

# 답이 길면 급한 상황에서 읽기 힘들다.
MAX_TOKENS = 512

# 0 에 가까울수록 같은 질문에 같은 답을 한다.
# 매뉴얼을 그대로 전하는 일이라 창의성이 필요 없다.
TEMPERATURE = 0.2

TIMEOUT_SECONDS = 60


def ask(system_prompt, user_prompt):
    """모델에 물어보고 답 글자만 돌려준다."""

    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
    }

    data = json.dumps(body).encode("utf-8")

    request = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={"Content-Type": "application/json"},
    )

    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        result = json.loads(response.read().decode("utf-8"))

    return result["choices"][0]["message"]["content"]
