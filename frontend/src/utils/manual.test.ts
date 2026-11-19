import { describe, expect, it } from 'vitest'

import type { ManualCard, ProcedureStep } from '@/types/manual'

import { groupsFor, groupsOf, partsOf } from './manual'

const step = (text: string): ProcedureStep => ({
  id: 'fall-1',
  step: '3단계',
  page: 10,
  text,
  tables: [],
  boxes: [],
})

const card = (text: string): ManualCard => ({
  id: 'card-1',
  mark: '①',
  name: '쓰러짐',
  page: 20,
  text,
  tables: [],
  boxes: [],
})

describe('partsOf', () => {
  it('이름·설명·체크 항목·곁들인 글로 가른다', () => {
    const parts = partsOf(step('신고\n출동대가 찾아올 수 있게 알린다\n□ 위치를 말한다\n□ 상태를 말한다\n침착하게 말한다'))

    expect(parts.name).toBe('신고')
    expect(parts.what).toBe('출동대가 찾아올 수 있게 알린다')
    expect(parts.checks).toEqual(['위치를 말한다', '상태를 말한다'])
    expect(parts.notes).toEqual([{ kind: 'text', text: '침착하게 말한다' }])
  })

  it('빈 줄과 앞뒤 공백을 버린다', () => {
    const parts = partsOf(step('\n  신고  \n\n설명\n'))

    expect(parts.name).toBe('신고')
    expect(parts.what).toBe('설명')
  })

  it('글이 비면 단계 이름을 쓴다', () => {
    expect(partsOf(step('')).name).toBe('3단계')
  })

  it('쌍이 이어지면 표로 묶는다', () => {
    const parts = partsOf(step('전파\n설명\n경찰(112): 사건 의심\n소방(119): 응급 환자'))

    expect(parts.notes).toEqual([
      {
        kind: 'pairs',
        rows: [
          ['경찰(112)', '사건 의심'],
          ['소방(119)', '응급 환자'],
        ],
      },
    ])
  })

  it('표 중간에 상황 없는 줄이 끼면 빈 칸으로 넣는다', () => {
    const parts = partsOf(step('전파\n설명\n경찰(112): 사건 의심\n관리사무소\n소방(119): 응급 환자'))

    expect(parts.notes).toEqual([
      {
        kind: 'pairs',
        rows: [
          ['경찰(112)', '사건 의심'],
          ['관리사무소', ''],
          ['소방(119)', '응급 환자'],
        ],
      },
    ])
  })

  it('한 줄짜리 표는 글로 되돌린다', () => {
    const parts = partsOf(step('전파\n설명\n경찰(112): 사건 의심\n그 밖의 글'))

    expect(parts.notes).toEqual([
      { kind: 'text', text: '경찰(112): 사건 의심' },
      { kind: 'text', text: '그 밖의 글' },
    ])
  })
})

describe('groupsOf', () => {
  it('소제목별로 묶고, 소제목 앞 줄은 제목 없는 묶음이 된다', () => {
    const groups = groupsOf(card('머리말\nCCTV에서 확인할 것\n쓰러진 자세\n신고할 곳\n119'))

    expect(groups).toEqual([
      { title: '', items: ['머리말'] },
      { title: 'CCTV에서 확인할 것', items: ['쓰러진 자세'] },
      { title: '신고할 곳', items: ['119'] },
    ])
  })
})

describe('groupsFor', () => {
  const text = 'CCTV에서 확인할 것\n쓰러진 자세\n신고할 때 꼭 말할 것\n의식 여부'

  it('단계 이름에 맞는 칸만 붙인다', () => {
    expect(groupsFor(card(text), '확인').map((g) => g.title)).toEqual(['CCTV에서 확인할 것'])
    expect(groupsFor(card(text), '신고·연계').map((g) => g.title)).toEqual(['신고할 때 꼭 말할 것'])
  })

  it('맞는 단계가 없으면 비어 있다', () => {
    expect(groupsFor(card(text), '종료')).toEqual([])
  })

  it('카드가 없으면 비어 있다', () => {
    expect(groupsFor(null, '확인')).toEqual([])
  })
})
