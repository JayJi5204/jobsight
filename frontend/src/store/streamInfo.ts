import { fetchStreamInfo } from '@/api/go2rtc'
import { createStore, useStore } from '@/store/createStore'
import type { StreamInfo } from '@/types/stream'

const POLL_MS = 5000

export interface StreamInfoFeed {
  status: 'loading' | 'ready' | 'error'
  /** 스트림 이름으로 찾는다 */
  byKey: Record<string, StreamInfo>
}

/**
 * go2rtc 가 지금 카메라에서 영상을 받고 있는지. 저장하지 않고 몇 초마다 다시 묻는다.
 *
 * 영상 타일이 없는 화면(지도·카메라 목록)에서도 카메라가 살아 있는지 알아야 한다.
 * 타일이 있는 화면에서는 타일이 직접 본 것이 더 정확하므로 그쪽이 앞선다.
 *
 * 실패해도 마지막으로 받은 값을 지우지 않는다 — go2rtc 에 한 번 못 닿았다고
 * 멀쩡한 카메라를 끊긴 것으로 말할 수는 없다.
 */
const store = createStore<StreamInfoFeed>({ status: 'loading', byKey: {} }, () => {
  const load = async () => {
    try {
      store.set({ status: 'ready', byKey: await fetchStreamInfo() })
    } catch {
      store.set((prev) => ({ status: 'error', byKey: prev.byKey }))
    }
    window.setTimeout(load, POLL_MS)
  }
  void load()
})

export function useStreamInfo(): StreamInfoFeed {
  return useStore(store)
}
