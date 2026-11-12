import { Fragment, useMemo } from 'react'
import { eventLabel } from '@/constants/events'
import type { ViewCamera } from '@/types/camera'
import type { DetectionEvent } from '@/types/event'
import {
  cellKey,
  GRID_GAP_PX,
  HEAT_BAND_COUNT,
  HEAT_CLASS,
  NAME_WIDTH,
  heatBandLabel,
  heatEdgesOf,
  heatLevelOf,
} from '@/utils/distribution'

interface Cell {
  total: number
  byKind: Record<string, number>
}

interface Props {
  /** 이미 기간·확인 여부로 걸러진 사건 */
  events: DetectionEvent[]
  cameras: ViewCamera[]
  /** 보고 있는 시각들. 자정을 넘긴 구간이면 23 다음에 0 이 온다 */
  hours: number[]
  /** 지금 시각. 칸 위에 선을 긋는다 */
  nowHour: number
  onPick: (cameraId: number, hour: number) => void
}

/**
 * 카메라 × 시간 분포.
 *
 * 그림이 아니라 거르개다. 칸을 누르면 그 카메라의 그 시간대 사건만 목록에 선다 —
 * 눌리지 않으면 "왜 여기가 붉은가" 에 답할 길이 없어 막다른 그림이 된다.
 */
export function EventDistribution({ events, cameras, hours, nowHour, onPick }: Props) {
  const byCell = useMemo(() => {
    const map = new Map<string, Cell>()
    for (const e of events) {
      const hour = new Date(e.detectedAt).getHours()
      const k = cellKey(e.cameraId, hour)
      const cell = map.get(k) ?? { total: 0, byKind: {} }
      cell.total += 1
      cell.byKind[e.kind] = (cell.byKind[e.kind] ?? 0) + 1
      map.set(k, cell)
    }
    return map
  }, [events])

  const countOf = (cameraId: number, hour: number) => byCell.get(cellKey(cameraId, hour))?.total ?? 0

  // 색 단계는 보고 있는 칸들 안에서 잡는다. 하루 전체의 봉우리에 눌려
  // 전부 같은 색으로 보이면 많고 적음을 읽을 수 없다
  const edges = useMemo(() => {
    let most = 0
    for (const cell of byCell.values()) most = Math.max(most, cell.total)
    return heatEdgesOf(most)
  }, [byCell])

  const tipOf = (camera: ViewCamera, hour: number) => {
    const cell = byCell.get(cellKey(camera.id, hour))
    const where = `${camera.location} ${hour}시`
    if (!cell) return `${where} · 기록 없음`
    const kinds = Object.entries(cell.byKind)
      .map(([kind, count]) => `${eventLabel(kind as DetectionEvent['kind'])} ${count}`)
      .join(', ')
    return `${where} · ${cell.total}건 (${kinds}) — 누르면 목록`
  }

  /**
   * 지금 시각 선의 가로 자리.
   *
   * 격자는 이름 칸 하나와 시각 칸 여럿을 같은 틈으로 벌려 놓았으므로, 칸 하나의 폭은
   * 남는 자리를 시각 수로 나눈 값이다. 그 칸의 가운데를 짚는다.
   */
  const nowAt = hours.indexOf(nowHour)
  const cellWidth = `((100% - ${NAME_WIDTH} - ${hours.length * GRID_GAP_PX}px) / ${hours.length})`
  const nowLeft = `calc(${NAME_WIDTH} + ${GRID_GAP_PX}px + ${nowAt} * (${cellWidth} + ${GRID_GAP_PX}px) + ${cellWidth} / 2)`

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 max-md:p-2">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="relative min-w-[44rem]">
          <div
            className="grid"
            style={{
              gap: GRID_GAP_PX,
              gridTemplateColumns: `${NAME_WIDTH} repeat(${hours.length}, minmax(1.1rem, 1fr))`,
              // 카메라가 한 대뿐일 때 줄 하나가 화면 높이만큼 늘어나지 않게 묶는다
              gridTemplateRows: `1.5rem repeat(${cameras.length}, minmax(1.75rem, 3.5rem))`,
            }}
          >
          <span />
          {hours.map((hour) => (
            <span key={hour} className="flex items-center justify-center type-caption text-muted tabular-nums">
              {hour}
            </span>
          ))}

          {cameras.map((camera) => (
            <Fragment key={camera.id}>
              <span className="flex items-center justify-end truncate pr-2 type-caption text-muted">{camera.location}</span>
              {hours.map((hour) => {
                const count = countOf(camera.id, hour)
                return (
                  <button
                    key={hour}
                    type="button"
                    disabled={count === 0}
                    title={tipOf(camera, hour)}
                    onClick={() => onPick(camera.id, hour)}
                    className={`flex items-center justify-center rounded-sm border border-transparent type-caption text-ink tabular-nums enabled:hover:outline-2 enabled:hover:-outline-offset-2 enabled:hover:outline-line-strong ${HEAT_CLASS[heatLevelOf(count, edges)]}`}
                  >
                    {/* 색만 있고 숫자가 없는 칸은 몇 건인지 물을 길이 없어 눌러 보는 수밖에 없다 */}
                    {count > 0 ? count : ''}
                  </button>
                )
              })}
            </Fragment>
          ))}
          </div>

          {/* 지금 시각 선은 격자 항목이 아니다. 항목으로 넣으면 그 칸을 차지해 뒤의 칸들이
              한 줄씩 밀리고 그 시간대 내용이 사라진다. 칸 위에 겹쳐 그린다 */}
          {nowAt >= 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-7 bottom-0 -ml-px w-0.5 rounded-sm bg-ok shadow-[0_0_7px_rgba(60,207,122,0.85)]"
              style={{ left: nowLeft }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-none flex-wrap items-center gap-3.5 pt-3 type-caption text-muted">
        <span>사건 수</span>
        {Array.from({ length: HEAT_BAND_COUNT + 1 }, (_, level) => (
          <span key={level} className="flex items-center gap-1.5">
            <i aria-hidden className={`h-2.5 w-5 rounded-sm border border-transparent ${HEAT_CLASS[level]}`} />
            {heatBandLabel(level, edges)}
          </span>
        ))}
      </div>
    </div>
  )
}
