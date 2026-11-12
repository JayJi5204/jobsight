import { useLocation, useNavigate } from 'react-router-dom'
import { Panel } from '@/components/atoms/Panel'
import { StatusDot } from '@/components/atoms/StatusDot'
import { SEVERITY_LABEL, SEVERITY_TEXT } from '@/constants/events'
import { ROUTES } from '@/constants/routes'
import { useZones, type ZoneRow } from '@/hooks/useZones'
import type { DisplayState } from '@/types/camera'

/** 지금 보고 있는 구역. 실시간이 ?zone= 으로 쥐고 있다 */
export function currentZoneId(search: string): number | null {
  const v = Number(new URLSearchParams(search).get('zone'))
  return Number.isInteger(v) && v > 0 ? v : null
}

/** 구역 하나를 한 글자로 줄이면 이것이다 — 걸린 사건이 있으면 그 단계, 없으면 영상이 오는가 */
const stateOf = (row: ZoneRow): DisplayState =>
  row.level ?? (row.slots.some((s) => s.state === 'live') ? 'live' : 'lost')

/**
 * 구역 상태반. 모든 화면의 왼쪽 기둥에 상주한다 — 장비를 손보는 중에도
 * 어느 구역이 달아올랐는지는 눈에 들어와야 한다.
 *
 * 두 칸씩 선다. 구가 스물다섯이라 한 줄에 하나씩 세우면 기둥이 스물다섯 줄이 되어
 * 아래쪽 구는 늘 굴려야 나온다. 두 칸이면 열세 줄로 끝난다.
 *
 * 칸 하나는 등 · 구 이름 · 카메라 자리 수다. 자리마다 등을 박지 않는 것은 한 구에
 * 스무 자리가 있어서다 — 기둥 폭에 스무 개를 넣으면 등 하나가 선 하나가 되어
 * 아무 뜻도 읽히지 않는다. 대신 그 구에서 가장 급한 것 하나가 등으로 선다.
 *
 * 칸은 기둥 높이를 나눠 갖는다. 위에 몰아 두면 아래가 빈 판으로 남아,
 * 거기에 더 있을 것이 있는지 없는지가 안 보인다. 구가 홀수라 오른쪽 아래
 * 한 칸이 비는데, 그 한 칸 때문에 마지막 구만 폭이 달라지는 쪽이 더 눈에 띈다.
 *
 * 평소에는 칸에 바탕을 깔지 않는다. 스물다섯 칸이 모두 칠해져 있으면 하나가
 * 달아올라도 그게 달라진 것인지 알아볼 수 없다. **위험만** 판을 물들인다.
 */
export function ZoneTree({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const rows = useZones()
  // 실시간은 고른 게 없으면 첫 구역을 본다. 기둥도 거기에 표를 해 둬야 화면과 맞는다
  const picked = currentZoneId(search) ?? (pathname === ROUTES.LIVE ? (rows[0]?.zone.id ?? null) : null)

  const go = (id: number) => navigate(`${ROUTES.LIVE}?zone=${id}`)

  return (
    <Panel
      title="구역"
      count={<span className="type-caption text-muted">{rows.length}</span>}
      className={`shrink-0 ${className}`}
    >
      <ul className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 overflow-y-auto">
        {rows.map((row, i) => {
          const { zone, slots, level, pending } = row
          const here = picked === zone.id
          return (
            <li key={zone.id}>
              <button
                type="button"
                onClick={() => go(zone.id)}
                aria-current={here || undefined}
                aria-label={[
                  zone.name,
                  `카메라 자리 ${slots.length}곳`,
                  level ? `${SEVERITY_LABEL[level]} ${pending}건 확인 필요` : '확인할 사건 없음',
                ].join(', ')}
                className={[
                  'grid h-full min-h-11 w-full grid-cols-[auto_1fr_auto] items-center gap-2 border-t border-white/3 px-3 text-left transition-colors',
                  i % 2 === 1 ? 'border-l border-l-white/3' : '',
                  level === 'danger' ? 'bg-crit-ink/8' : '',
                  here ? 'bg-white/6' : 'hover:bg-white/3',
                ].join(' ')}
              >
                <StatusDot state={stateOf(row)} size="sm" />
                <span
                  className={[
                    'min-w-0 truncate type-caption',
                    level ? `font-bold ${SEVERITY_TEXT[level]}` : here ? 'font-semibold text-ink' : 'text-muted',
                  ].join(' ')}
                >
                  {zone.name}
                </span>
                <span className={`type-caption tabular-nums ${level ? SEVERITY_TEXT[level] : 'text-[#394046]'}`}>
                  {slots.length}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
