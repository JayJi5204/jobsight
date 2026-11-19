import { describe, expect, it } from 'vitest'

import { cellWidthOf } from './cameraGrid'

describe('cellWidthOf', () => {
  it('넓은 자리에서는 높이에 맞춘다', () => {
    expect(cellWidthOf(1, 2000, 900, 0)).toBe(1600)
  })

  it('높은 자리에서는 너비에 맞춘다', () => {
    expect(cellWidthOf(1, 1600, 2000, 0)).toBe(1600)
  })

  it('칸 사이 틈을 뺀다', () => {
    expect(cellWidthOf(2, 1004, 2000, 4)).toBe(500)
  })

  it('크기가 0 이하이면 0 이다', () => {
    expect(cellWidthOf(2, 0, 500)).toBe(0)
    expect(cellWidthOf(2, 500, -1)).toBe(0)
  })
})
