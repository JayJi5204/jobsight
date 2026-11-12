import { createStore, useStore } from '@/store/createStore'
import { SEVERITY_ORDER, severityOf } from '@/constants/events'
import type { DetectionEvent, Severity } from '@/types/event'

/**
 * 사건 목록.
 *
 * **아직 비어 있다.** 탐지와 이벤트 API 가 생기면 `createStore` 의 둘째 인자로
 * 그 구독을 넣는다 — 첫 화면이 이 목록을 볼 때 한 번만 불린다.
 * 받아 온 목록은 `store.set(list)` 로 넣으면 보는 화면이 모두 따라 바뀐다.
 *
 * 비어 있는 동안 윗줄 계수기는 0, 사건·지도·경보 칸은 빈 상태로 선다.
 */
const store = createStore<DetectionEvent[]>([])

export function useEvents(): DetectionEvent[] {
  return useStore(store)
}

export function ackEvent(id: string) {
  store.set((list) =>
    list.map((e) => (e.id === id && e.status === 'open' ? { ...e, status: 'acked' as const, ackedAt: new Date().toISOString() } : e)),
  )
}

/**
 * 확인 안 된 사건이 걸린 카메라와 그 카메라의 가장 높은 단계.
 * 한 카메라에 여러 건이 걸려 있으면 제일 급한 것이 그 카메라의 색이 된다.
 */
export function openSeverityByCamera(events: DetectionEvent[]): Map<number, Severity> {
  const out = new Map<number, Severity>()
  for (const e of events) {
    if (e.status !== 'open') continue
    const level = severityOf(e.kind)
    const now = out.get(e.cameraId)
    if (now === undefined || SEVERITY_ORDER.indexOf(level) < SEVERITY_ORDER.indexOf(now)) out.set(e.cameraId, level)
  }
  return out
}
