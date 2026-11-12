/** 화면 분할. 1대 크게, 2×2, 3×3, 4×4 */
export type GridSize = 1 | 2 | 3 | 4

export const GRID_SIZES: readonly GridSize[] = [1, 2, 3, 4]

/** 기본은 2×2. 카메라가 한 대여도 자리를 미리 보여 준다. */
export const DEFAULT_GRID: GridSize = 2
