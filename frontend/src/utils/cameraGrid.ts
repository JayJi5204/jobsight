import type { GridSize } from '@/types/layout'

/** 카메라 영상은 16:9 다. 칸을 늘여 채우면 그림이 찌그러진다. */
export const VIDEO_ASPECT = 16 / 9
export const GRID_GAP_PX = 4

/**
 * size×size 격자를 담는 쪽에 넣을 때, 16:9 를 지키면서 가장 큰 칸의 너비.
 * 남는 자리는 비운다 — 꽉 채우려고 비율을 깨지 않는다.
 */
export function cellWidthOf(size: GridSize, width: number, height: number, gap = GRID_GAP_PX): number {
  if (width <= 0 || height <= 0) return 0
  const byWidth = (width - gap * (size - 1)) / size
  const byHeight = ((height - gap * (size - 1)) / size) * VIDEO_ASPECT
  return Math.max(0, Math.floor(Math.min(byWidth, byHeight)))
}
