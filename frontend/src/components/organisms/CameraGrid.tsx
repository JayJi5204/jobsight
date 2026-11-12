import { useRef } from 'react'
import { CameraTile } from '@/components/molecules/CameraTile'
import { useElementSize } from '@/hooks/useElementSize'
import type { SlotView } from '@/hooks/useZones'
import { GRID_GAP_PX, VIDEO_ASPECT, cellWidthOf } from '@/utils/cameraGrid'
import type { GridSize } from '@/types/layout'

interface Props {
  slots: SlotView[]
  size: GridSize
  focusedKey: string | null
  onToggleFocus: (key: string) => void
}

/**
 * 고른 분할만큼 자리를 만들고 카메라 자리를 순서대로 채운다.
 * 칸은 16:9 로 고정한다. 늘여 채우면 그림이 찌그러진다.
 *
 * 남는 칸은 그리지 않는다 — 자리는 구역이 정하고, 격자는 그 자리를 담을 뿐이다.
 * 실물이 없는 자리도 타일로 서서 신호 없음이라고 말한다.
 */
export function CameraGrid({ slots, size, focusedKey, onToggleFocus }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const box = useElementSize(ref)
  const width = cellWidthOf(size, box.width, box.height)

  return (
    <div
      ref={ref}
      className="grid h-full min-h-0 w-full place-content-center"
      style={{
        gap: GRID_GAP_PX,
        gridTemplateColumns: `repeat(${size}, ${width}px)`,
        gridTemplateRows: `repeat(${size}, ${width / VIDEO_ASPECT}px)`,
      }}
    >
      {slots.map((slot) => (
        <div key={slot.key} className="min-h-0 min-w-0 overflow-hidden rounded-sm">
          <CameraTile
            slot={slot}
            focused={focusedKey === slot.key}
            onToggleFocus={() => onToggleFocus(slot.key)}
          />
        </div>
      ))}
    </div>
  )
}
