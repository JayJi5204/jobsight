/**
 * 녹화 재생. MediaMTX 의 재생 서버가 직접 내보낸다 — 실시간 영상처럼 백엔드를 거치지 않는다.
 * 개발에서는 vite 프록시가, 운영에서는 리버스 프록시가 /playback 을 넘겨 준다.
 *
 * 경로 이름은 카메라의 streamKey 와 같다.
 * 값은 모두 URL 인코딩해서 넣는다 — 시각의 '+' 가 그대로 가면 공백으로 읽힌다.
 */
const PLAYBACK_BASE = '/playback'

/**
 * 구간 머리를 짚었을 때 뒤로 미는 양.
 *
 * MediaMTX 는 구간 시작을 마이크로초까지 안다(`15:33:58.743553`). 그런데 `Date.parse`
 * 는 밀리초까지만 읽어 `…743` 이 되고, 그 값은 **데이터가 시작되기 553µs 전**이다.
 * 그대로 요청하면 「그 시각에는 녹화가 없다」며 404 가 온다(실측). 1ms 를 버리는
 * 대신 머리를 짚어도 열리게 한다.
 */
const EPSILON_MS = 1

/** 되돌려 볼 구간 하나. 기본은 fMP4 라 <video> 가 그대로 재생한다. format 'mp4' 는 내려받기용 */
export function playbackUrl(streamKey: string, startMs: number, durationSec: number, format?: 'mp4'): string {
  const params = new URLSearchParams({
    path: streamKey,
    start: new Date(startMs + EPSILON_MS).toISOString(),
    duration: String(Math.max(1, Math.round(durationSec))),
  })
  if (format) params.set('format', format)
  return `${PLAYBACK_BASE}/get?${params.toString()}`
}
