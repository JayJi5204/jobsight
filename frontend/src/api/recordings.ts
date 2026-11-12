import axios from 'axios'
import { api } from '@/api/http'
import type { RecordingSegment } from '@/types/recording'
import { fmtDateParam } from '@/utils/time'

/** 녹화 기능 자체가 아직 없을 때 (백엔드에 그 경로가 없음) */
export class RecordingsUnavailableError extends Error {}
/** 그 카메라를 백엔드가 모를 때 (목록을 받은 뒤 지워졌을 때 등) */
export class CameraNotFoundError extends Error {}

/**
 * 백엔드는 두 경우 모두 404 로 답한다 — 경로가 없을 때와 카메라를 모를 때.
 * 상태 코드만으로는 가를 수 없어 본문의 표시를 함께 본다.
 *
 * 지금은 RFC 7807 ProblemDetail 의 detail 에 들어 있고("camera-not-found: 9999"),
 * 나중에 code 로 옮겨간다고 한다. 둘 다 보고, 모양이 다르면 통째로 훑는다.
 */
const CAMERA_NOT_FOUND = 'camera-not-found'

function isCameraNotFound(data: unknown): boolean {
  if (typeof data === 'string') return data.includes(CAMERA_NOT_FOUND)
  if (typeof data !== 'object' || data === null) return false
  const { detail, code } = data as { detail?: unknown; code?: unknown }
  return [detail, code].some((v) => typeof v === 'string' && v.includes(CAMERA_NOT_FOUND))
}

/**
 * 한 카메라의 하루치 녹화 구간. GET /api/recordings?cameraId=1&date=2026-11-10
 * 응답은 RecordingSegment[] (cameraId, start, end — 시간대가 붙은 ISO 시각).
 * 녹화가 없는 날은 빈 배열이다.
 *
 * 저장소가 아직 없으면 404 가 오고 RecordingsUnavailableError 로 올려 보낸다 —
 * 부르는 쪽이 「녹화 없음」과 「아직 못 물어봤다」를 가를 수 있어야 한다.
 */
export const fetchRecordingSegments = async (cameraId: number, day: Date, signal?: AbortSignal): Promise<RecordingSegment[]> => {
  try {
    const params = { cameraId, date: fmtDateParam(day) }
    return (await api.get<RecordingSegment[]>('/recordings', { params, signal })).data
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined
    if (status === 404 || status === 501) {
      if (axios.isAxiosError(err) && isCameraNotFound(err.response?.data)) throw new CameraNotFoundError()
      throw new RecordingsUnavailableError()
    }
    throw err
  }
}
