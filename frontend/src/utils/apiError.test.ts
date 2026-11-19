import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'

import { messageOf } from './apiError'

const failed = (status: number, data: unknown) => {
  const config = { headers: new AxiosHeaders() }
  const response = { status, statusText: '', headers: {}, config, data } as AxiosResponse
  return new AxiosError('failed', 'ERR_BAD_RESPONSE', config, undefined, response)
}

describe('messageOf', () => {
  it('서버가 말한 이유를 쓴다', () => {
    expect(messageOf(failed(400, { detail: '이름이 비었습니다' }), '저장 실패')).toBe('이름이 비었습니다')
  })

  it('detail 이 없으면 message, title 순으로 찾는다', () => {
    expect(messageOf(failed(400, { title: 'Bad Request' }), '저장 실패')).toBe('Bad Request')
  })

  it('글로 온 답은 그대로 쓰되 HTML 은 버린다', () => {
    expect(messageOf(failed(400, '중복입니다'), '저장 실패')).toBe('중복입니다')
    expect(messageOf(failed(400, '<html>error</html>'), '저장 실패')).toBe('저장 실패 (HTTP 400)')
  })

  it('서버에 닿지 못하거나 5xx 면 offline 을 쓴다', () => {
    const noResponse = new AxiosError('Network Error', 'ERR_NETWORK')

    expect(messageOf(noResponse, '저장 실패', '서버에 연결할 수 없습니다')).toBe('서버에 연결할 수 없습니다')
    expect(messageOf(failed(502, ''), '저장 실패', '서버에 연결할 수 없습니다')).toBe('서버에 연결할 수 없습니다')
  })

  it('axios 오류가 아니면 오류 메시지나 fallback 을 쓴다', () => {
    expect(messageOf(new Error('터짐'), '저장 실패')).toBe('터짐')
    expect(messageOf('?', '저장 실패')).toBe('저장 실패')
  })
})
