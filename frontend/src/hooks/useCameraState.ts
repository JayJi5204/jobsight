import { useCallback } from 'react'
import { openSeverityByCamera, useEvents } from '@/store/events'
import { useStreamInfo } from '@/store/streamInfo'
import { useStreamStates } from '@/store/streamStatus'
import type { Camera, DisplayState } from '@/types/camera'

/**
 * 카메라 한 대가 지금 어떤 상태인지. 목록·지도·타일이 같은 판단을 쓰도록 한곳에 둔다.
 *
 * 순서가 곧 근거의 세기다.
 *   1. 확인 안 된 사건이 있으면 그것이 먼저다 — 영상이 잘 나와도 봐야 할 것은 봐야 한다.
 *   2. 이 화면에 영상 타일이 있으면 타일이 직접 본 것을 쓴다. 가장 정확하다.
 *   3. 타일이 없으면 go2rtc 에 물어본 것을 쓴다. 카메라에서 받고 있으면 연결된 것이다.
 *   4. 그마저 모르면 '대기' — 끊겼다고 말하지 않는다. 모르는 것과 끊긴 것은 다르다.
 */
export function useCameraState(): (camera: Pick<Camera, 'id' | 'streamKey'>) => DisplayState {
  const tileStates = useStreamStates()
  const alarms = openSeverityByCamera(useEvents())
  const { status, byKey } = useStreamInfo()

  return useCallback(
    (camera) => {
      const alarm = alarms.get(camera.id)
      if (alarm) return alarm

      const fromTile = tileStates.get(camera.id)
      if (fromTile) return fromTile

      if (status === 'loading') return 'connecting'
      const info = byKey[camera.streamKey]
      if (!info) return status === 'ready' ? 'lost' : 'idle'
      return info.receiving ? 'live' : 'idle'
    },
    [alarms, tileStates, status, byKey],
  )
}
