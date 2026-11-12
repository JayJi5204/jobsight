/**
 * 사건. `GET /api/events` 가 돌려주는 모양 그대로다.
 *
 * 종류는 넷으로 정해졌다: 추락 · 화재 · 침입 · 배회.
 * 단계(위험·경고·주의)는 종류에서 나온다 — 사건마다 따로 붙이지 않는다.
 * 어느 종류가 어느 단계인지는 constants/events.ts 한 곳에만 있다.
 *
 * 대문자인 것은 서버의 enum 이름을 그대로 받기 때문이다. 카메라의 `zone` 도
 * `GANGNAM` 으로 온다 — 어떤 값은 소문자, 어떤 값은 대문자면 받는 쪽이 매번 확인해야 한다.
 */
export type EventStatus = 'OPEN' | 'ACKED'

export type EventKind = 'FALL' | 'FIRE' | 'INTRUSION' | 'LOITERING'

/** 사건 단계. 급한 순서대로 위험 · 경고 · 주의 */
export type Severity = 'danger' | 'warning' | 'caution'

/** 빈 칸은 서버가 `null` 로 보낸다. 없는 것과 모르는 것을 가르려면 `!= null` 로 본다 */
export interface DetectionEvent {
  id: number
  cameraId: number
  kind: EventKind
  /** ISO 시각 */
  detectedAt: string
  /** 사건이 끝난 시각. 아직 이어지는 중이면 비어 있다 */
  endedAt?: string | null
  status: EventStatus
  ackedAt?: string | null
  /** 어느 모델이 잡았는가 */
  model?: string | null
  /** 그 모델의 확신도 0~1 */
  confidence?: number | null
}
