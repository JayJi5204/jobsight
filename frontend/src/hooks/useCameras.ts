import { useMemo } from 'react'
import { useCameraFeed } from '@/store/cameras'
import type { ViewCamera } from '@/types/camera'

export interface CamerasView {
  status: 'loading' | 'ready' | 'error'
  cameras: ViewCamera[]
  error: string | null
}

/** 화면에서 쓰는 카메라 목록. 백엔드가 돌려준 실제 카메라만 쓴다 */
export function useCameras(): CamerasView {
  const feed = useCameraFeed()
  const cameras = useMemo(() => feed.cameras.map((c, i) => ({ ...c, code: i + 1 })), [feed.cameras])
  return { status: feed.status, cameras, error: feed.error }
}
