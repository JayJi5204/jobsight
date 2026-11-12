import axios from 'axios'

/** 백엔드가 실패를 알리는 모양 (RFC 7807 ProblemDetail) */
interface ProblemDetail {
  title?: unknown
  detail?: unknown
  message?: unknown
}

/**
 * 화면에 보여 줄 한 줄. 서버가 이유를 말했으면 그 말을, 아니면 fallback 을 쓴다.
 * 서버에 닿지도 못했을 때는 offline 을 쓴다 — 요청이 틀린 것과 서버가 없는 것은 다른 일이다.
 */
export function messageOf(err: unknown, fallback: string, offline?: string): string {
  if (!axios.isAxiosError(err)) return err instanceof Error && err.message ? err.message : fallback
  if (offline && (!err.response || err.response.status >= 500)) return offline

  const data = err.response?.data as ProblemDetail | string | undefined
  if (typeof data === 'string' && data.trim() && !data.trimStart().startsWith('<')) return data
  if (data && typeof data === 'object') {
    for (const v of [data.detail, data.message, data.title]) {
      if (typeof v === 'string' && v.trim()) return v
    }
  }
  return err.response ? `${fallback} (HTTP ${err.response.status})` : fallback
}
