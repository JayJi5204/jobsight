FROM nvcr.io/nvidia/pytorch:25.08-py3

WORKDIR /app/ai

RUN python -c "import torch; print('torch==' + torch.__version__)" > /tmp/torch.txt

RUN pip install --no-cache-dir -c /tmp/torch.txt \
    fastapi \
    "uvicorn[standard]" \
    "psycopg[binary]" \
    python-dotenv \
    pymupdf \
    sentence-transformers 

RUN python -c "import torch; assert torch.version.cuda, 'torch가 CPU 휠로 바뀌었다'"

COPY ai/pyproject.toml ./
COPY ai/src ./src

ENV PYTHONPATH=/app/ai/src

EXPOSE 8099

CMD ["python", "-m","uvicorn","jobsight.api:app", \
    "--host","0.0.0.0","--port","8099","--app-dir","src"]