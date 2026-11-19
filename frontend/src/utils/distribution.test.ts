import { describe, expect, it } from 'vitest'

import {
  dayText,
  endOfDayText,
  heatBandLabel,
  heatEdgesOf,
  heatLevelOf,
  hourText,
  hoursInRange,
  startOfDayText,
} from './distribution'

describe('heatEdgesOf', () => {
  it('가장 많은 칸을 다섯으로 나눈 자리에 경계를 둔다', () => {
    expect(heatEdgesOf(50)).toEqual([10, 20, 30, 40])
  })

  it('수가 적어도 경계가 겹치지 않는다', () => {
    const edges = heatEdgesOf(2)
    for (let i = 1; i < edges.length; i += 1) {
      expect(edges[i]).toBeGreaterThan(edges[i - 1])
    }
  })
})

describe('heatLevelOf', () => {
  const edges = heatEdgesOf(50)

  it('0 은 기록이 없는 칸이다', () => {
    expect(heatLevelOf(0, edges)).toBe(0)
  })

  it('경계값은 아랫단에 든다', () => {
    expect(heatLevelOf(10, edges)).toBe(1)
    expect(heatLevelOf(11, edges)).toBe(2)
  })

  it('가장 많은 칸은 맨 윗단이다', () => {
    expect(heatLevelOf(50, edges)).toBe(5)
  })
})

describe('heatBandLabel', () => {
  const edges = heatEdgesOf(50)

  it('구간이 겹치지 않게 적는다', () => {
    expect(heatBandLabel(1, edges)).toBe('1~10')
    expect(heatBandLabel(2, edges)).toBe('11~20')
  })

  it('맨 윗단은 열어 둔다', () => {
    expect(heatBandLabel(5, edges)).toBe('41 이상')
  })
})

describe('hoursInRange', () => {
  it('끝 시각은 포함하지 않는다', () => {
    expect(hoursInRange(9, 12)).toEqual([9, 10, 11])
  })

  it('끝이 시작보다 빠르면 자정을 넘긴다', () => {
    expect(hoursInRange(22, 2)).toEqual([22, 23, 0, 1])
  })

  it('0 부터 24 까지는 하루 전체다', () => {
    expect(hoursInRange(0, 24)).toHaveLength(24)
  })
})

describe('날짜 글', () => {
  it('시각을 두 자리로 적는다', () => {
    expect(hourText(9)).toBe('09:00')
  })

  it('yyyy-mm-dd 로 적는다', () => {
    expect(dayText(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('하루의 처음과 끝을 현지 시각으로 읽는다', () => {
    expect(startOfDayText('2026-11-19')).toBe(new Date(2026, 10, 19).getTime())
    expect(endOfDayText('2026-11-19')).toBe(new Date(2026, 10, 20).getTime() - 1)
  })
})
