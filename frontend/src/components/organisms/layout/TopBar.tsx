import { Link, NavLink } from 'react-router-dom'
import { StatusStrip } from '@/components/molecules/StatusStrip'
import { NAV, ROUTES } from '@/constants/routes'
import { useClock } from '@/hooks/useClock'
import { fmtDate, fmtTime } from '@/utils/time'

/**
 * 윗줄. 이름판 · 화면 이동 · 시각 · 계수기.
 *
 * 폭이 좁아질 때 내려놓는 순서는 연도 → 이름판 → 한 줄 짜임이다.
 * 끝까지 남는 것은 계수기 셋 — 이 화면을 켜는 이유가 그 숫자이기 때문이다.
 * 내려놓는다고 지우지 않는다. 한 줄이 두 줄이 되고, 화면별 조작은 이 줄에 올라오지 않는다 — 그 화면의 왼쪽 기둥이 맡는다.
 */
export function TopBar() {
  const now = useClock()

  const tabs = (
    <nav aria-label="화면" className="flex min-w-0 items-stretch self-stretch">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === ROUTES.LIVE}
          className={({ isActive }) =>
            [
              'relative flex shrink-0 items-center justify-center px-4 type-body font-semibold transition-colors max-md:px-3',
              isActive
                ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-accent'
                : 'text-muted hover:text-ink',
            ].join(' ')
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  const clock = (
    <div className="flex shrink-0 items-baseline gap-2.5 type-body whitespace-nowrap">
      <span className="text-muted">{fmtDate(now)}</span>
      <time dateTime={now.toISOString()} className="text-ink">
        {fmtTime(now)}
      </time>
    </div>
  )

  return (
    <header className="plate plate-grain plate-screws z-20 flex shrink-0 flex-col select-none wide:h-24 wide:flex-row wide:items-stretch">
      {/* 좁은 화면은 두 줄이다. 위가 탭과 시각, 아래가 계수기 — 이름판은 뺀다 */}
      <div className="hdr-rows min-w-0 flex-col">
        <div className="flex min-h-13 min-w-0 items-stretch gap-3 border-b border-line pr-5 pl-2">
          {/* 휴대폰 폭에서는 아래 탭이 같은 길을 내준다. 둘을 다 세우면 시각과 붙는다 */}
          <span className="flex max-md:hidden">{tabs}</span>
          <span className="flex-1" />
          <span className="flex items-center">{clock}</span>
        </div>
        <StatusStrip full />
      </div>

      {/* 넓은 화면은 한 줄 그대로 */}
      <div className="hdr-row min-w-0 flex-1 items-stretch">
        {/* 누르면 첫 화면으로 간다. 글자만 걸지 않고 칸 전체를 누르게 둔다 */}
        <Link
          to={ROUTES.LIVE}
          aria-label="jobsight 실시간 화면으로"
          className="hdr-brand w-(--pane-width) shrink-0 items-center justify-center border-r border-line px-4 transition-colors hover:bg-white/3"
        >
          {/* 자간이 마지막 글자 뒤에도 붙어서, 그만큼 왼쪽을 밀어야 칸 가운데에 선다 */}
          <span className="pl-[0.3em] text-xl font-bold tracking-[0.3em] text-ink [text-shadow:var(--engrave)]">
            JOBSIGHT
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 items-stretch gap-3 pr-6 pl-2 wide:gap-4 wide:pr-8 wide:pl-3">
          {tabs}
          <span className="flex-1" />
          <span className="flex items-center">{clock}</span>
        </div>

        <StatusStrip />
      </div>
    </header>
  )
}
