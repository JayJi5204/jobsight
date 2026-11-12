import { api } from '@/api/http'
import type { DetectionEvent } from '@/types/event'

/**
 * 사건 목록. GET /api/events
 *
 * 거르개(기간·카메라·종류·상태)는 서버가 받지만 여기서는 쓰지 않는다. 화면이 보여 주는
 * 범위가 서로 달라서(계수기는 전부, 분포는 기간, 목록은 거기에 짚은 자리까지) 한 번 받아
 * 함께 걸러 쓰는 쪽이 요청도 적고 숫자도 안 어긋난다. 건수가 늘어 한 번에 못 받게 되면
 * 그때 기간을 넘기면 된다.
 */
export const fetchEvents = async (signal?: AbortSignal): Promise<DetectionEvent[]> =>
  (await api.get<DetectionEvent[]>('/events', { signal })).data

/** 확인 처리. PATCH /api/events/{id} — 확인한 시각은 서버가 찍는다 */
export const reviewEvent = async (id: number): Promise<DetectionEvent> =>
  (await api.patch<DetectionEvent>(`/events/${id}`, { status: 'ACKED' })).data
