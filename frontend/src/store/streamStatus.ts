import { createStore, useStore } from '@/store/createStore'
import type { CameraState } from '@/types/camera'

/**
 * 영상 상태. 타일이 실제 프레임을 보고 알려 준다.
 * 저장하지 않는다 — 타일이 사라지면 그 카메라는 다시 '모름(idle)'이 된다.
 */
const store = createStore<ReadonlyMap<number, CameraState>>(new Map())

export function setStreamState(cameraId: number, state: CameraState) {
  store.set((prev) => {
    if (prev.get(cameraId) === state) return prev
    const next = new Map(prev)
    next.set(cameraId, state)
    return next
  })
}

export function clearStreamState(cameraId: number) {
  store.set((prev) => {
    if (!prev.has(cameraId)) return prev
    const next = new Map(prev)
    next.delete(cameraId)
    return next
  })
}

export function useStreamStates(): ReadonlyMap<number, CameraState> {
  return useStore(store)
}
