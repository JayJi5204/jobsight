import { api } from '@/api/http'
import type { Camera } from '@/types/camera'

/** 등록된 카메라 목록. GET /api/cameras */
export const fetchCameras = async (signal?: AbortSignal): Promise<Camera[]> =>
  (await api.get<Camera[]>('/cameras', { signal })).data
