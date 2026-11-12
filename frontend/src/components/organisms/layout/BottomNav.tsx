import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/atoms/Icon'
import { NAV, ROUTES } from '@/constants/routes'

/** 휴대폰 폭의 화면 이동. 엄지가 닿는 아래쪽에, 네 칸을 모두 보이게 둔다 */
export function BottomNav() {
  return (
    <nav
      aria-label="화면"
      style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}
      className="plate plate-grain grid shrink-0 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === ROUTES.LIVE}
          className={({ isActive }) =>
            [
              'relative flex min-h-14 flex-col items-center justify-center gap-1 type-caption transition-colors',
              isActive ? 'text-ink before:absolute before:inset-x-5 before:top-0 before:h-[3px] before:bg-accent' : 'text-muted',
            ].join(' ')
          }
        >
          <Icon name={item.icon} size={20} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
