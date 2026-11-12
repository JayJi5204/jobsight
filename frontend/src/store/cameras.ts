import { fetchCameras } from '@/api/cameras'
import { messageOf } from '@/utils/apiError'
import { createStore, useStore } from '@/store/createStore'
import type { Camera } from '@/types/camera'

export interface CameraFeed {
  status: 'loading' | 'ready' | 'error'
  cameras: Camera[]
  /** 마지막 갱신이 실패했으면 그 이유. 이미 받은 목록은 그대로 둔다 */
  error: string | null
}

const REFRESH_MS = 60_000
const RETRY_MS = 5_000

/**
 * 카메라 목록은 거의 바뀌지 않는다. 앱 전체가 한 번 받아 함께 쓰고, 느리게 다시 받는다.
 * 갱신이 실패해도 받아 둔 목록을 지우지 않는다 — 영상은 백엔드를 거치지 않으므로
 * 백엔드가 잠깐 죽었다고 잘 나오던 화면을 걷어낼 이유가 없다.
 */
const store = createStore<CameraFeed>({ status: 'loading', cameras: [], error: null }, () => {
  const load = async () => {
    try {
      const cameras = await fetchCameras()
      store.set({ status: 'ready', cameras, error: null })
    } catch (e) {
      const message = messageOf(e, '카메라 목록을 받지 못했습니다', '서버에 연결하지 못했습니다')
      store.set((prev) => (prev.status === 'ready' ? { ...prev, error: message } : { status: 'error', cameras: [], error: message }))
    }
    window.setTimeout(load, store.get().error ? RETRY_MS : REFRESH_MS)
  }
  void load()
})

export function useCameraFeed(): CameraFeed {
  return useStore(store)
}
