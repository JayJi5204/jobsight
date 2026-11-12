import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/atoms/Icon'
import { StatusDot } from '@/components/atoms/StatusDot'
import { ROUTES } from '@/constants/routes'
import { currentZoneId } from '@/components/organisms/ZoneTree'
import { useZones } from '@/hooks/useZones'
import type { DisplayState } from '@/types/camera'

/**
 * 옆 구역으로 한 칸. 휴대폰 폭에서는 접는다 — 격자 고르개와 한 줄을 나눠 쓰는데,
 * 화살표 둘이 104px 을 가져가면 구 이름이 밀려 사라진다. 목록만으로도 다 고를 수 있고,
 * 가나다순 이웃은 덱처럼 위아래로 이어진 것도 아니라 한 칸씩 옮길 일이 드물다.
 */
const STEP =
  'grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-line-strong text-muted transition-colors enabled:hover:text-ink disabled:text-[#2f353a] max-[599px]:hidden'

/**
 * 구역 기둥이 없는 폭에서 쓰는 구역 고르개.
 *
 * 스물다섯 줄짜리 기둥은 375px 에서 높이의 5분의 1을 먹고도 글자가 뭉개진다.
 * 여기서는 지금 구역만 세우고, 옆 구역은 화살표로 한 칸씩, 먼 구역은 목록에서
 * 바로 고른다 — 강남구에서 중랑구까지 화살표로만 가면 스물네 번을 눌러야 한다.
 *
 * 닫힌 모습은 **직접 그리고**, 그 위에 투명한 `<select>` 를 덮었다.
 * 등을 구 이름 바로 왼쪽에 두려면 그 수밖에 없다 — 네이티브 고르개 안에는
 * 글자밖에 못 넣어서 색 점을 넣을 자리가 없다. 목록 자체는 브라우저가 그린다:
 * 직접 그리면 판이 overflow-hidden 이라 떠 있는 목록이 모서리에서 잘린다.
 */
export function ZonePager({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const rows = useZones()
  const here = currentZoneId(useLocation().search) ?? rows[0]?.zone.id ?? null
  const at = rows.findIndex((r) => r.zone.id === here)
  const row = at >= 0 ? rows[at] : null

  if (row === null) return null

  const go = (index: number) => {
    const next = rows[index]
    if (next) navigate(`${ROUTES.LIVE}?zone=${next.zone.id}`)
  }

  // 기둥의 등과 같은 규칙 — 걸린 사건이 있으면 그 단계, 없으면 영상이 오는가
  const state: DisplayState = row.level ?? (row.slots.some((s) => s.state === 'live') ? 'live' : 'lost')

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button type="button" aria-label="이전 구역" disabled={at <= 0} onClick={() => go(at - 1)} className={STEP}>
        <Icon name="chevronLeft" size={18} />
      </button>

      <span className="relative flex h-11 min-w-0 flex-1 items-center gap-2 rounded-sm border border-line-strong bg-panel px-3">
        {/* 등이 앞, 이름이 뒤다 — 기둥의 줄도 등이 왼쪽이라 눈이 같은 자리를 짚는다.
            둘은 가운데에 붙어 선다. 고르개 폭을 꽉 채우면 양끝으로 갈라진다 */}
        <span className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <StatusDot state={state} size="sm" />
          <span className="truncate type-body text-ink">{row.zone.name}</span>
        </span>
        <Icon name="chevronRight" size={14} className="shrink-0 rotate-90 text-muted" />
        <select
          aria-label="구역 고르기"
          value={String(row.zone.id)}
          onChange={(e) => navigate(`${ROUTES.LIVE}?zone=${e.target.value}`)}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 [color-scheme:dark]"
        >
          {rows.map((r) => (
            <option key={r.zone.id} value={r.zone.id}>
              {r.zone.name}
            </option>
          ))}
        </select>
      </span>

      <button
        type="button"
        aria-label="다음 구역"
        disabled={at >= rows.length - 1}
        onClick={() => go(at + 1)}
        className={STEP}
      >
        <Icon name="chevronRight" size={18} />
      </button>
    </div>
  )
}
