import { endEvent, falsePositiveEvent, fetchEvents, reviewEvent } from '@/api/events'
import { messageOf } from '@/utils/apiError'
import { createStore, useStore } from '@/store/createStore'
import { SEVERITY_ORDER, severityOf } from '@/constants/events'
import type { DetectionEvent, Severity } from '@/types/event'

export interface EventFeed {
  status: 'loading' | 'ready' | 'error'
  events: DetectionEvent[]
  /** 마지막 갱신이 실패했으면 그 이유. 이미 받은 목록은 그대로 둔다 */
  error: string | null
}

/**
 * 카메라 목록보다 자주 받는다. 탐지가 붙으면 사건은 수시로 들어오고,
 * 윗줄 계수기와 깜빡이는 테두리가 그만큼 늦게 반응한다.
 */
const REFRESH_MS = 10_000
const RETRY_MS = 5_000

/**
 * 사건 목록. 화면 여럿이 같은 목록을 본다 — 계수기도 분포도 경보 칸도 카메라 테두리도.
 *
 * 한 군데서 받아 나눠 쓰는 것은 숫자가 어긋나지 않게 하기 위해서다. 화면마다 따로 받으면
 * 같은 순간에 계수기는 셋, 목록은 둘이 되는 자리가 생긴다.
 *
 * 갱신이 실패해도 받아 둔 목록은 지우지 않는다. 백엔드가 잠깐 끊겼다고 방금까지 보던
 * 경보를 화면에서 걷어내면, 당직자는 상황이 끝난 줄 안다.
 */
const store = createStore<EventFeed>({ status: 'loading', events: [], error: null }, () => {
  const load = async () => {
    try {
      const events = await fetchEvents()
      store.set({ status: 'ready', events, error: null })
    } catch (e) {
      const message = messageOf(e, '사건 목록을 받지 못했습니다', '서버에 연결하지 못했습니다')
      store.set((prev) =>
        prev.status === 'ready' ? { ...prev, error: message } : { status: 'error', events: [], error: message },
      )
    }
    window.setTimeout(load, store.get().error ? RETRY_MS : REFRESH_MS)
  }
  void load()
})

export function useEventFeed(): EventFeed {
  return useStore(store)
}

export function useEvents(): DetectionEvent[] {
  return useStore(store).events
}

/**
 * 확인 처리. 서버에 먼저 알리고, 돌아온 사건으로 목록을 갈아 끼운다.
 *
 * 누르자마자 화면부터 바꾸는 길(낙관적 갱신)도 있지만 쓰지 않았다. 확인 처리는 "이 경보는
 * 내가 봤다"는 기록이라, 서버에 안 닿았는데 꺼진 것처럼 보이면 그 경보는 아무도 다시 안 본다.
 */
/** 닿았으면 true. 부르는 쪽이 화면을 바꿀지 말지 여기서 가린다 */
async function send(
  id: number,
  call: (id: number) => Promise<DetectionEvent>,
  failed: string,
): Promise<boolean> {
  try {
    const updated = await call(id)
    store.set((prev) => ({ ...prev, events: prev.events.map((e) => (e.id === id ? updated : e)) }))
    return true
  } catch (e) {
    store.set((prev) => ({ ...prev, error: messageOf(e, failed, '서버에 연결하지 못했습니다') }))
    return false
  }
}

export async function ackEvent(id: number): Promise<boolean> {
  return send(id, reviewEvent, '확인 처리를 못 했습니다')
}

/**
 * 대응 종료. 진짜 사건이었고 할 일이 끝났다는 뜻이다.
 *
 * 경보 칸에서 내려가고 카메라 테두리도 꺼진다. 그래서 서버가 받은 것을 확인하고 나서
 * 화면을 바꾼다 — 안 닿았는데 꺼지면 아직 진행 중인 사건이 사라진 것처럼 보인다.
 */
export async function closeEvent(id: number): Promise<boolean> {
  return send(id, endEvent, '사건을 종료하지 못했습니다')
}

/**
 * 오탐 처리. 사건이 아니었다는 뜻이다.
 *
 * 종료와 따로 두는 것은 화면 때문이 아니라 기록 때문이다. 감지 모델이 얼마나 틀리는지는
 * 그 자리에서 본 사람이 눌러 준 이 한 번으로만 알 수 있다.
 */
export async function markFalsePositive(id: number): Promise<boolean> {
  return send(id, falsePositiveEvent, '오탐 처리를 못 했습니다')
}

/**
 * 확인 안 된 사건이 걸린 카메라와 그 카메라의 가장 높은 단계.
 * 한 카메라에 여러 건이 걸려 있으면 제일 급한 것이 그 카메라의 색이 된다.
 */
export function openSeverityByCamera(events: DetectionEvent[]): Map<number, Severity> {
  const out = new Map<number, Severity>()
  for (const e of events) {
    if (e.status !== 'OPEN') continue
    const level = severityOf(e.kind)
    const now = out.get(e.cameraId)
    if (now === undefined || SEVERITY_ORDER.indexOf(level) < SEVERITY_ORDER.indexOf(now)) out.set(e.cameraId, level)
  }
  return out
}
