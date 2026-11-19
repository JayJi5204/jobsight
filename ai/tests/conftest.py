"""
무거운 모듈을 가짜로 바꿔 끼우는 자리.

검색과 답변은 psycopg·sentence-transformers 를 불러온다. 테스트에서는 DB 도
GPU 도 쓰지 않으므로 그 모듈을 빈 껍데기로 바꾸고, 쓰는 함수만 갈아 끼운다.
그래야 CI 가 torch 를 받지 않고 몇 초 만에 끝난다.
"""

import importlib
import sys
import types

import pytest

HEAVY = ["psycopg", "dotenv", "sentence_transformers"]


@pytest.fixture
def light_import(monkeypatch):
    """무거운 모듈 없이 jobsight 모듈을 새로 불러온다."""

    for name in HEAVY:
        monkeypatch.setitem(sys.modules, name, types.ModuleType(name))

    sys.modules["dotenv"].load_dotenv = lambda *args, **kwargs: None
    sys.modules["sentence_transformers"].SentenceTransformer = object

    def load(name):
        for loaded in list(sys.modules):
            if loaded.startswith("jobsight."):
                monkeypatch.delitem(sys.modules, loaded)
        return importlib.import_module(name)

    return load
