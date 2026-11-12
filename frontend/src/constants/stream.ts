/**
 * 영상은 백엔드를 거치지 않는다. 브라우저가 go2rtc 에 직접 붙는다.
 * 개발에서는 vite 프록시가, 운영에서는 리버스 프록시가 /go2rtc 를 넘겨 준다.
 * 같은 출처라서 CORS 설정이 필요 없다.
 */
export const GO2RTC_BASE = '/go2rtc'

/** go2rtc 웹 컴포넌트가 붙을 주소 (내부에서 ws 로 바뀐다). 어느 경로에서든 같은 주소가 되도록 절대 경로로 만든다 */
export function streamUrl(streamKey: string): URL {
  return new URL(`${GO2RTC_BASE}/api/ws?src=${encodeURIComponent(streamKey)}`, window.location.origin)
}

/** 정지 화면 한 장 */
export function frameUrl(streamKey: string): string {
  return `${GO2RTC_BASE}/api/frame.jpeg?src=${encodeURIComponent(streamKey)}`
}

export const GO2RTC_COMPONENT = `${GO2RTC_BASE}/video-stream.js`

/** 첫 프레임을 이만큼 기다려도 안 오면 끊김으로 본다 */
export const CONNECT_TIMEOUT_MS = 10_000
/** 프레임이 이만큼 멈춰 있으면 끊김으로 본다 */
export const STALL_MS = 4_000
