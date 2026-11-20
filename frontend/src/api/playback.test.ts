import { describe, expect, it } from 'vitest'

import { playbackUrl } from './playback'

const startOf = (url: string) => new URLSearchParams(url.split('?')[1]).get('start')
const paramsOf = (url: string) => Object.fromEntries(new URLSearchParams(url.split('?')[1]))

describe('playbackUrl', () => {
  const AT = Date.UTC(2026, 10, 20, 6, 33, 58, 743)

  it('구간 머리보다 1ms 뒤를 가리킨다', () => {
    // MediaMTX 가 아는 시작은 …743553 인데 Date.parse 로는 …743 까지만 남는다.
    // 그대로 보내면 데이터 시작 전이라 404 다
    expect(startOf(playbackUrl('CAM-001', AT, 300))).toBe('2026-11-20T06:33:58.744Z')
  })

  it('경로와 길이를 그대로 싣는다', () => {
    expect(paramsOf(playbackUrl('CAM-001', AT, 300))).toEqual({
      path: 'CAM-001',
      start: '2026-11-20T06:33:58.744Z',
      duration: '300',
    })
  })

  it('길이는 초 단위 정수이고 최소 1초다', () => {
    expect(paramsOf(playbackUrl('CAM-001', AT, 0.2)).duration).toBe('1')
    expect(paramsOf(playbackUrl('CAM-001', AT, 59.6)).duration).toBe('60')
  })

  it('내려받기는 format 이 붙는다', () => {
    expect(paramsOf(playbackUrl('CAM-001', AT, 300, 'mp4')).format).toBe('mp4')
    expect(paramsOf(playbackUrl('CAM-001', AT, 300)).format).toBeUndefined()
  })

  it('시각의 + 가 그대로 나가지 않는다 — Z 로 보낸다', () => {
    // Go 의 url.Query() 가 '+' 를 공백으로 읽어 시각이 깨진다
    expect(startOf(playbackUrl('CAM-001', AT, 300))).not.toContain('+')
  })
})
