import { useEffect, useRef, useState } from 'react'
import { fetchRecordingSegments } from '@/api/recordings'
import type { RecordingSegment } from '@/types/recording'

export type SegmentLoad =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; segments: RecordingSegment[] }

/** 받아 올 폴더 하나 */
export interface SegmentRequest {
  /** 받은 것을 담아 둘 이름. 부르는 쪽이 정한다 */
  key: string
  cameraId: number
  /** 그 날 0시 */
  day: number
}

/**
 * 펼쳐 둔 폴더마다 그 날의 녹화 구간을 받아 둔다.
 *
 * 무엇을 받을지는 부르는 쪽이 정하고([SegmentRequest] 목록), 여기는 받는 일만 한다.
 * [useRecordingSegments](./useRecordingSegments.ts) 와 같은 일을 하되 한 번에 여럿을
 * 맡고, 한 번 받은 것은 그대로 둔다 — 폴더를 접었다 펴도 다시 묻지 않는다.
 *
 * **같은 자리를 두 번 묻지 않는 표시는 ref 에 둔다.** 상태에 두면 그 상태가 바뀌면서
 * 효과가 다시 돌고, 그 정리 함수가 방금 띄운 요청을 끊는다. 끊긴 요청은 무시되고
 * 다시 돈 효과는 「이미 물어봤다」며 건너뛰어, 「받는 중」에서 영영 멈춘다.
 *
 * **요청을 끊지 않는다.** AbortController 로 끊으면 StrictMode 가 효과를 두 번 돌릴 때
 * 자기 요청을 자기가 끊고 위와 같은 자리에서 멈춘다. 받아 오는 것이 작은 GET 하나라
 * 끊는 이득보다 이 함정이 크다. 판이 사라진 뒤 돌아온 값은 버리기만 한다.
 */
export function useTreeSegments(requests: SegmentRequest[]): Record<string, SegmentLoad> {
  const [loads, setLoads] = useState<Record<string, SegmentLoad>>({})
  const asked = useRef<Set<string>>(new Set())
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    for (const { key, cameraId, day } of requests) {
      if (asked.current.has(key)) continue
      asked.current.add(key)

      setLoads((prev) => ({ ...prev, [key]: { status: 'loading' } }))
      fetchRecordingSegments(cameraId, new Date(day))
        .then((segments) => {
          if (alive.current) setLoads((prev) => ({ ...prev, [key]: { status: 'ready', segments } }))
        })
        .catch(() => {
          if (alive.current) setLoads((prev) => ({ ...prev, [key]: { status: 'error' } }))
        })
    }
  }, [requests])

  return loads
}
