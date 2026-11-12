import { useMemo } from 'react'
import { SEVERITY_ORDER, severityOf } from '@/constants/events'
import { ZONES, type Zone } from '@/constants/zones'
import { useCameraState } from '@/hooks/useCameraState'
import { useCameras } from '@/hooks/useCameras'
import { useEvents } from '@/store/events'
import type { CameraSlot, DisplayState } from '@/types/camera'
import type { Severity } from '@/types/event'

/** 자리 하나가 지금 어떤지. 실물이 없는 자리는 늘 '신호 없음' 이다 */
export interface SlotView extends CameraSlot {
  /** 백엔드가 아는 카메라 번호. 사건은 이 번호로 붙는다. 실물이 없으면 null */
  cameraId: number | null
  /** go2rtc 에 물을 이름. 등록된 자리만 값이 있다 */
  streamKey: string | null
  state: DisplayState
}

export interface ZoneRow {
  zone: Zone
  slots: SlotView[]
  /** 이 구역에 걸린 미확인 사건 중 가장 높은 단계. 없으면 null */
  level: Severity | null
  /** 확인이 남은 사건 수 */
  pending: number
}

/**
 * 구역 아홉 줄. 왼쪽 기둥 · 지도 · 영상 벽이 같은 판단을 쓰도록 한곳에서 센다.
 *
 * 자리는 카메라가 붙어 있든 아니든 그대로 남는다 — 그래야 한 대가 빠져도
 * 벽의 칸이 밀리지 않고, 비어 있다는 것 자체가 화면에 보인다.
 *
 * 카메라 상태는 [useCameraState](./useCameraState.ts) 가 이미 사건까지 섞어 내므로
 * 여기서 다시 따지지 않는다. 여기가 더하는 것은 구역 단위의 요약 둘뿐이다.
 */
export function useZones(): ZoneRow[] {
  const { cameras } = useCameras()
  const events = useEvents()
  const stateOf = useCameraState()

  return useMemo(() => {
    const byStream = new Map(cameras.map((c) => [c.streamKey, c]))

    return ZONES.map((zone) => {
      const slots = zone.slots.map((slot): SlotView => {
        const live = byStream.get(slot.key)
        // 서버가 다른 구역이라고 하면 그 말을 따른다 — 자리표는 화면 것이고 구역은 서버 것이다
        if (live === undefined || live.zone !== zone.code) {
          return { ...slot, cameraId: null, streamKey: null, state: 'lost' }
        }
        // 실물이 붙은 자리는 백엔드가 준 이름이 이긴다. CAM-001 보다 '강남역' 이 쓸모 있다
        return { ...slot, label: live.location, cameraId: live.id, streamKey: live.streamKey, state: stateOf(live) }
      })

      const ids = new Set(slots.map((s) => s.cameraId).filter((id): id is number => id !== null))
      const open = events.filter((e) => e.status === 'open' && ids.has(e.cameraId))

      let level: Severity | null = null
      for (const e of open) {
        const at = severityOf(e.kind)
        if (level === null || SEVERITY_ORDER.indexOf(at) < SEVERITY_ORDER.indexOf(level)) level = at
      }

      return { zone, slots, level, pending: open.length }
    })
  }, [cameras, events, stateOf])
}
