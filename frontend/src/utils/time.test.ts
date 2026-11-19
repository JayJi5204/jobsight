import { describe, expect, it } from 'vitest'

import { fmtAgo, fmtDate, fmtDateParam, fmtStamp, sameDay } from './time'

const d = new Date(2026, 10, 9, 7, 5, 3)

describe('시각 글', () => {
  it('API 날짜는 yyyy-mm-dd 다', () => {
    expect(fmtDateParam(d)).toBe('2026-11-09')
  })

  it('파일 이름 시각은 자리를 채운다', () => {
    expect(fmtStamp(d)).toBe('20261109_070503')
  })

  it('요일을 붙인다', () => {
    expect(fmtDate(d)).toBe('11월 9일 (월)')
  })
})

describe('fmtAgo', () => {
  const now = new Date(2026, 10, 9, 12, 0, 0)
  const before = (ms: number) => new Date(now.getTime() - ms)

  it('1분이 안 되면 방금이다', () => {
    expect(fmtAgo(before(59_000), now)).toBe('방금')
  })

  it('분·시간·일로 올라간다', () => {
    expect(fmtAgo(before(5 * 60_000), now)).toBe('5분 전')
    expect(fmtAgo(before(3 * 3_600_000), now)).toBe('3시간 전')
    expect(fmtAgo(before(2 * 86_400_000), now)).toBe('2일 전')
  })
})

describe('sameDay', () => {
  it('시각이 달라도 같은 날이면 같다', () => {
    expect(sameDay(new Date(2026, 10, 9, 0, 0), new Date(2026, 10, 9, 23, 59))).toBe(true)
  })

  it('자정을 넘기면 다른 날이다', () => {
    expect(sameDay(new Date(2026, 10, 9, 23, 59), new Date(2026, 10, 10, 0, 0))).toBe(false)
  })
})
