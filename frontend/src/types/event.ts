/**
 * 사건. 아직 백엔드에 API 가 없다 — 목록은 전부 가짜다(src/mocks).
 *
 * 종류는 넷으로 정해졌다: 추락 · 화재 · 침입 · 배회.
 * 단계(위험·경고·주의)는 종류에서 나온다 — 사건마다 따로 붙이지 않는다.
 * 어느 종류가 어느 단계인지는 constants/events.ts 한 곳에만 있다.
 */
export type EventStatus = 'open' | 'acked'

export type EventKind = 'fall' | 'fire' | 'intrusion' | 'loitering'

/** 사건 단계. 급한 순서대로 위험 · 경고 · 주의 */
export type Severity = 'danger' | 'warning' | 'caution'

export interface DetectionEvent {
  id: string
  cameraId: number
  kind: EventKind
  /** ISO 시각 */
  detectedAt: string
  /** 사건이 끝난 시각. 순간이 아니라 구간으로 잡히는 탐지가 있다 */
  endedAt?: string
  status: EventStatus
  ackedAt?: string
  /** 어느 모델이 잡았는가 */
  model?: string
  /** 그 모델의 확신도 0~1 */
  confidence?: number
}
