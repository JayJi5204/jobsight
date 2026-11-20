import { describe, expect, it } from 'vitest'

import { hoursOf, slotsOf } from './recordingTree'

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
