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
 * 그 시각이 든 5분 칸. 왼쪽 폴더의 잎과 **같은 칸**이어야 둘이 같은 곳을 가리킨다.
 *
 * [slotsOf](#slotsOf) 와 같은 규칙으로 자른다 — 벽시계 5분 경계에서 끊고, 녹화가
 * 있는 데까지만 남긴다. 그래서 15:33 에 시작한 녹화의 첫 칸은 15:33~15:35 다.
 */
export function slotAt(spanStart: number, spanEnd: number, at: number): RecordedSpan | null {
  if (at < spanStart || at >= spanEnd) return null

  const slotStart = Math.floor(at / SLOT_MS) * SLOT_MS
  const start = Math.max(slotStart, spanStart)
  const end = Math.min(slotStart + SLOT_MS, spanEnd)

  return end > start ? { start, end } : null
}

/** 한 시간 띠 안에서 무엇인가가 차지하는 자리. 백분율이고, 띠 밖으로 나가지 않는다 */
export interface Box {
  leftPct: number
  widthPct: number
}

/**
 * 열어 둔 녹화가 이 시간 띠에서 덮는 자리.
 *
 * 합쳐진 구간은 몇 시간씩 이어지므로 길이를 그대로 그리면 띠 밖으로 삐져나간다.
 * **양쪽을 띠에 맞춰 자른다** — 왼쪽만 자르고 길이를 그대로 두면, 이전 시에서
 * 시작한 구간이 잘린 만큼 더 길어져 오른쪽으로 더 밀려난다.
 *
 * 너무 얇아 안 보이는 자리에는 최소 폭을 주되, 그만큼 왼쪽으로 밀어 띠 안에 둔다.
 * 덮는 자리가 없으면 null — 그릴 것이 없다는 뜻이다.
 */
export function hourBox(hourStart: number, start: number, lengthMs: number, minPct = 0.8): Box | null {
  const from = Math.max(start, hourStart)
  const to = Math.min(start + lengthMs, hourStart + HOUR_MS)
  if (to <= from) return null

  const widthPct = Math.max(minPct, ((to - from) / HOUR_MS) * 100)
  const leftPct = Math.max(0, Math.min(((from - hourStart) / HOUR_MS) * 100, 100 - widthPct))

  return { leftPct, widthPct }
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

