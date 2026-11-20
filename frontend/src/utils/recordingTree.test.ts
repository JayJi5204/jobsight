import { describe, expect, it } from 'vitest'

import { hourBox, hoursOf, slotAt, slotsOf } from './recordingTree'

const DAY = Date.UTC(2026, 10, 19)
const HOUR = 3_600_000
const at = (hour: number, minute = 0) => new Date(DAY + hour * HOUR + minute * 60_000).toISOString()

describe('hoursOf', () => {
  it('여러 시간에 걸친 구간을 시간 칸으로 쪼갠다', () => {
    const hours = hoursOf([{ cameraId: 1, start: at(1, 30), end: at(3, 15) }], DAY)

    expect(hours.map((h) => h.hour)).toEqual([1, 2, 3])
    expect(hours.map((h) => h.ms)).toEqual([30 * 60_000, HOUR, 15 * 60_000])
  })

  it('녹화가 없는 시간은 내놓지 않는다', () => {
    const hours = hoursOf([{ cameraId: 1, start: at(5), end: at(5, 10) }], DAY)

    expect(hours).toHaveLength(1)
    expect(hours[0].hour).toBe(5)
  })

  it('끊긴 자리가 있으면 토막이 여럿이 된다', () => {
    const hours = hoursOf(
      [
        { cameraId: 1, start: at(7, 0), end: at(7, 10) },
        { cameraId: 1, start: at(7, 40), end: at(7, 50) },
      ],
      DAY,
    )

    expect(hours[0].spans).toHaveLength(2)
    expect(hours[0].ms).toBe(20 * 60_000)
  })

  it('하루 밖의 구간과 잘못된 시각은 버린다', () => {
    const hours = hoursOf(
      [
        { cameraId: 1, start: at(-3), end: at(-1) },
        { cameraId: 1, start: 'not-a-date', end: at(2) },
        { cameraId: 1, start: at(4), end: at(3) },
      ],
      DAY,
    )

    expect(hours).toEqual([])
  })
})

describe('slotsOf', () => {
  const span = (fromMin: number, toMin: number) => ({ start: DAY + fromMin * 60_000, end: DAY + toMin * 60_000 })
  const asMinutes = (slots: { start: number; end: number }[]) =>
    slots.map((s) => [(s.start - DAY) / 60_000, (s.end - DAY) / 60_000])

  it('이어진 토막을 5분 칸으로 끊는다', () => {
    expect(asMinutes(slotsOf([span(0, 20)]))).toEqual([
      [0, 5],
      [5, 10],
      [10, 15],
      [15, 20],
    ])
  })

  it('벽시계 5분 경계에 맞춘다 — 녹화가 시작된 시각부터 세지 않는다', () => {
    expect(asMinutes(slotsOf([span(3, 13)]))).toEqual([
      [3, 5],
      [5, 10],
      [10, 13],
    ])
  })

  it('5분이 안 되는 토막도 한 칸으로 남긴다', () => {
    expect(asMinutes(slotsOf([span(7, 8)]))).toEqual([[7, 8]])
  })

  it('토막이 여럿이면 각각 끊는다', () => {
    expect(asMinutes(slotsOf([span(0, 7), span(20, 25)]))).toEqual([
      [0, 5],
      [5, 7],
      [20, 25],
    ])
  })

  it('빈 목록은 빈 목록이다', () => {
    expect(slotsOf([])).toEqual([])
  })
})

describe('slotAt', () => {
  const span = (fromMin: number, toMin: number) => [DAY + fromMin * 60_000, DAY + toMin * 60_000] as const
  const asMinutes = (slot: { start: number; end: number } | null) =>
    slot && [(slot.start - DAY) / 60_000, (slot.end - DAY) / 60_000]

  it('그 시각이 든 5분 칸을 준다', () => {
    const [a, b] = span(0, 60)
    expect(asMinutes(slotAt(a, b, DAY + 17 * 60_000))).toEqual([15, 20])
  })

  it('폴더 잎과 같은 칸이다 — 녹화 시작이 칸 가운데면 거기서 끊는다', () => {
    // 15:33 에 시작한 녹화의 15:34 는 15:33~15:35 칸이다 (slotsOf 와 같아야 한다)
    const [a, b] = span(33, 90)
    expect(asMinutes(slotAt(a, b, DAY + 34 * 60_000))).toEqual([33, 35])
  })

  it('녹화 끝이 칸 가운데면 거기서 끊는다', () => {
    const [a, b] = span(0, 13)
    expect(asMinutes(slotAt(a, b, DAY + 11 * 60_000))).toEqual([10, 13])
  })

  it('구간 밖이면 없다', () => {
    const [a, b] = span(10, 20)
    expect(slotAt(a, b, DAY + 5 * 60_000)).toBeNull()
    expect(slotAt(a, b, DAY + 25 * 60_000)).toBeNull()
    expect(slotAt(a, b, b)).toBeNull()
  })
})

describe('hourBox', () => {
  /** 15시 */
  const HOUR = DAY + 15 * 3_600_000
  const min = (n: number) => n * 60_000
  const round = (box: { leftPct: number; widthPct: number } | null) =>
    box && { leftPct: Math.round(box.leftPct * 10) / 10, widthPct: Math.round(box.widthPct * 10) / 10 }

  it('칸 안에 다 들어가는 구간은 그대로 그린다', () => {
    expect(round(hourBox(HOUR, HOUR + min(15), min(15)))).toEqual({ leftPct: 25, widthPct: 25 })
  })

  it('다음 시로 넘어가는 구간은 칸 끝에서 자른다', () => {
    // 15:35 부터 47분 — 16:22 까지지만 15시 칸은 25분만 남았다
    expect(round(hourBox(HOUR, HOUR + min(35), min(47)))).toEqual({ leftPct: 58.3, widthPct: 41.7 })
  })

  it('앞 시에서 시작한 구간은 칸 머리에서 자른다', () => {
    // 14:50 부터 30분 — 15시 칸에 걸치는 것은 앞의 20분뿐이다
    expect(round(hourBox(HOUR, HOUR - min(10), min(30)))).toEqual({ leftPct: 0, widthPct: 33.3 })
  })

  it('칸을 통째로 덮어도 100% 를 넘지 않는다', () => {
    expect(round(hourBox(HOUR, HOUR - min(30), min(180)))).toEqual({ leftPct: 0, widthPct: 100 })
  })

  it('너무 얇으면 최소 폭을 주되 칸 안에 둔다', () => {
    const box = hourBox(HOUR, HOUR + min(60) - 100, 100)
    expect(box).not.toBeNull()
    expect(box!.widthPct).toBeCloseTo(0.8)
    expect(box!.leftPct + box!.widthPct).toBeLessThanOrEqual(100)
  })

  it('이 시간에 걸치지 않으면 그릴 것이 없다', () => {
    expect(hourBox(HOUR, HOUR + min(70), min(10))).toBeNull()
    expect(hourBox(HOUR, HOUR - min(30), min(10))).toBeNull()
  })
})
