import { Icon } from '@/components/atoms/Icon'
import { Segmented } from '@/components/atoms/Segmented'
import { GRID_SIZES, type GridSize } from '@/types/layout'

const TITLE: Record<GridSize, string> = {
  1: '1대 크게',
  2: '2×2 분할',
  3: '3×3 분할',
  4: '4×4 분할',
}

/** 분할 고르개. 아무도 조작하지 않는 벽 화면이라 크게 드러내지 않고 윗줄 오른쪽에 둔다 */
export function LayoutPicker({ value, onChange }: { value: GridSize; onChange: (size: GridSize) => void }) {
  return (
    <Segmented
      label="화면 분할"
      value={value}
      options={GRID_SIZES.map((size) => ({ value: size, label: <Icon name={`grid${size}`} />, title: TITLE[size] }))}
      onChange={onChange}
    />
  )
}
