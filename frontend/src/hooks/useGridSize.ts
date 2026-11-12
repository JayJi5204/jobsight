import { useCallback, useState } from 'react'
import { readStorage, writeStorage } from '@/store/storage'
import { DEFAULT_GRID, type GridSize } from '@/types/layout'

const KEY = 'jobsight.layout'

function parse(value: string | null): GridSize | null {
  const n = Number(value)
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null
}

/**
 * 분할 선택. 주소의 ?grid= 가 가장 앞선다 — 벽 화면을 켤 때 주소로 고정할 수 있게.
 * 그다음은 이 브라우저가 마지막으로 고른 값, 없으면 2×2.
 */
export function useGridSize(): [GridSize, (size: GridSize) => void] {
  const [size, setSize] = useState<GridSize>(
    () => parse(new URLSearchParams(window.location.search).get('grid')) ?? parse(readStorage(KEY)) ?? DEFAULT_GRID,
  )
  const choose = useCallback((next: GridSize) => {
    setSize(next)
    writeStorage(KEY, String(next))
  }, [])
  return [size, choose]
}
