import { useEffect, useState } from 'react'
import { CameraNotFoundError, fetchRecordingSegments, RecordingsUnavailableError } from '@/api/recordings'
import { messageOf } from '@/utils/apiError'
import type { RecordingSegment } from '@/types/recording'

export type RecordingsState =
  | { status: 'loading' }
  /** 녹화 기능이 아직 없다 */
  | { status: 'unavailable' }
  /** 백엔드가 이 카메라를 모른다 */
  | { status: 'unknown-camera' }
  | { status: 'error'; message: string }
  | { status: 'ready'; segments: RecordingSegment[] }

/** 고른 카메라·날짜의 녹화 구간 */
export function useRecordingSegments(cameraId: number | undefined, dayStart: number): RecordingsState {
  const [state, setState] = useState<RecordingsState>({ status: 'loading' })

  useEffect(() => {
    if (cameraId === undefined) return
    const ac = new AbortController()
    setState({ status: 'loading' })
    fetchRecordingSegments(cameraId, new Date(dayStart), ac.signal)
      .then((segments) => setState({ status: 'ready', segments }))
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
        if (e instanceof RecordingsUnavailableError) setState({ status: 'unavailable' })
        else if (e instanceof CameraNotFoundError) setState({ status: 'unknown-camera' })
        else setState({ status: 'error', message: messageOf(e, '녹화 목록을 받지 못했습니다', '녹화 서버에 연결하지 못했습니다') })
      })
    return () => ac.abort()
  }, [cameraId, dayStart])

  return state
}
