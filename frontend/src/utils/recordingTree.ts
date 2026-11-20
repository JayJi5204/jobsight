import type { RecordingSegment } from '@/types/recording'

const HOUR_MS = 3_600_000

/** 폴더에서 짚는 단위 */
export const SLOT_MS = 5 * 60_000

/** 한 시간 칸 안에 실제로 녹화가 남아 있는 토막. 끊긴 자리가 있으면 여럿이 된다 */
export interface RecordedSpan {
  start: number
  end: number
}

export interface HourNode {
  /** 0‥23 */
  hour: number
  spans: RecordedSpan[]
  /** 이 시간에 녹화가 남아 있는 총 길이 */
  ms: number
}

/**
 * 하루치 구간을 시간 칸으로 쪼갠다.
 *
 * 구간 하나가 새벽부터 점심까지 이어지더라도 폴더에서는 시간별로 짚을 수 있어야 한다.
 * 녹화가 한 토막도 없는 시간은 아예 내놓지 않는다 — 빈 폴더를 스물네 개 세우지 않는다.
 */
export function hoursOf(segments: RecordingSegment[], dayStart: number): HourNode[] {
  const spans = segments
    .map((s) => [Date.parse(s.start), Date.parse(s.end)] as const)
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)

  const out: HourNode[] = []
  for (let hour = 0; hour < 24; hour += 1) {
    const from = dayStart + hour * HOUR_MS
    const to = from + HOUR_MS
    const inside: RecordedSpan[] = []
    let ms = 0
    for (const [a, b] of spans) {
      const start = Math.max(a, from)
      const end = Math.min(b, to)
      if (end > start) {
        inside.push({ start, end })
        ms += end - start
      }
    }
    if (inside.length > 0) out.push({ hour, spans: inside, ms })
  }
  return out
}

/**
 * 이어진 토막을 5분 칸으로 끊는다.
 *
 * 녹화기는 끊길 이유가 없으면 몇 시간이고 이어 간다. 그 토막을 그대로 잎으로 세우면
 * 한 시간에 잎이 하나뿐이라 15시 03분으로 갈 길이 없다 — 폴더가 짚는 자리가 아니라
 * 읽는 줄이 되어 버린다.
 *
 * 벽시계 5분 경계(00·05·10…)에 맞춰 끊는다. 녹화가 시작된 시각부터 세면 잎 이름이
 * 15:33, 15:38 처럼 나와서, 사람이 세는 시각과 어긋난다.
 */
export function slotsOf(spans: RecordedSpan[]): RecordedSpan[] {
  const out: RecordedSpan[] = []
  for (const span of spans) {
    for (let from = Math.floor(span.start / SLOT_MS) * SLOT_MS; from < span.end; from += SLOT_MS) {
      const start = Math.max(from, span.start)
      const end = Math.min(from + SLOT_MS, span.end)
      if (end > start) out.push({ start, end })
    }
  }
  return out
}

