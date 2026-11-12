import { api } from '@/api/http'
import type { SystemInfo } from '@/types/system'

/** 장비 상태. GET /api/system. 백엔드에 아직 이 경로가 없어 지금은 404 가 온다 */
export const fetchSystem = async (signal?: AbortSignal): Promise<SystemInfo> =>
  (await api.get<SystemInfo>('/system', { signal })).data
