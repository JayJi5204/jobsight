const p2 = (n: number) => String(n).padStart(2, '0')
const DAYS = '일월화수목금토'

/** API 의 date 파라미터. 현장 시각 기준 2026-11-10 모양 */
export const fmtDateParam = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`

/** 파일 이름에 넣는 시각. 20261110_174223 모양 */
export const fmtStamp = (d: Date) =>
  `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`

export const fmtTime = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`
export const fmtHM = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`
export const fmtDate = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`
export const fmtDateTime = (d: Date) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${fmtTime(d)}`

/** 'n분 전' 처럼 지금과의 거리 */
export function fmtAgo(d: Date, now = new Date()): string {
  const sec = Math.round((now.getTime() - d.getTime()) / 1000)
  if (sec < 60) return '방금'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export const DAY_MS = 86_400_000

/** 2026년 11월 5일. 날짜가 바뀌는 자리에 세우는 구분줄이 쓴다 */
export const fmtDayFull = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`

/** 같은 날인지 가르는 열쇠 */
export const dayKeyOf = (iso: string) => new Date(iso).toDateString()
