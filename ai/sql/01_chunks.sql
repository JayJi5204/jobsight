CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chunks(
    id text PRIMARY KEY,
    kind text NOT NULL,
    doc text NOT NULL,
    page integer NOT NULL,
    chapter text NOT NULL,
    section text NOT NULL,
    text text NOT NULL,
    embedding vector(1024) NOT NULL,
    tables jsonb DEFAULT '[]'::jsonb,
    boxes jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_chunks_kind ON chunks (kind);