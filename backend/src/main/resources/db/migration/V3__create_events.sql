CREATE TABLE events(
    id BIGSERIAL PRIMARY KEY,
    camera_id BIGINT NOT NULL REFERENCES cameras(id),
    kind VARCHAR(20) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    status VARCHAR(10) NOT NULL DEFAULT 'OPEN',
    acked_at TIMESTAMPTZ,
    model VARCHAR(30),
    confidence REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_detected_at ON events (detected_at DESC);
CREATE INDEX idx_events_status_detected_at ON events (status, detected_at DESC);
