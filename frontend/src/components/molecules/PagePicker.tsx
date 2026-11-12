import { Icon } from '@/components/atoms/Icon'

/** 한 번에 세우는 쪽 수 */
const WINDOW = 10

/**
 * 지금 쪽에서 시작하는 열 칸짜리 창. 1~10 에서 다음을 누르면 2~11, 또 누르면 3~12.
 *
 * 창이 지금 쪽을 따라 한 칸씩 밀리므로 다음 쪽이 늘 눈앞에 있다. 끝에 닿으면
 * 더 밀 데가 없어 창이 멈춘다 — 스무 쪽이면 11~20 에서 멈춘다.
 */
function pagesToShow(total: number, current: number): number[] {
  const from = Math.max(1, Math.min(current, total - WINDOW + 1))
  const to = Math.min(total, from + WINDOW - 1)
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

const cell = 'grid h-11 min-w-11 place-items-center rounded-sm px-2 type-caption tabular-nums transition-colors'

/** 쪽 넘기개. 한 구역 안에서만 넘긴다 — 쪽수는 그 구역의 자리 수로 정해진다 */
export function PagePicker({
  pages,
  current,
  onPick,
  label,
}: {
  /** 전체 쪽수 (1부터) */
  pages: number
  /** 지금 쪽 (1부터) */
  current: number
  onPick: (page: number) => void
  label: string
}) {
  if (pages <= 1) return null

  return (
    <nav aria-label={label} className="flex items-center gap-1">
      <button
        type="button"
        aria-label="이전 쪽"
        disabled={current === 1}
        onClick={() => onPick(current - 1)}
        className={`${cell} text-muted enabled:hover:bg-white/5 enabled:hover:text-ink disabled:text-[#2f353a]`}
      >
        <Icon name="chevronLeft" size={16} />
      </button>

      {pagesToShow(pages, current).map((p) => (
        <button
          key={p}
          type="button"
          aria-label={`${p}쪽`}
          aria-current={p === current || undefined}
          onClick={() => onPick(p)}
          className={`${cell} ${
            p === current ? 'bg-white/8 font-semibold text-ink' : 'text-muted hover:bg-white/5 hover:text-ink'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        aria-label="다음 쪽"
        disabled={current === pages}
        onClick={() => onPick(current + 1)}
        className={`${cell} text-muted enabled:hover:bg-white/5 enabled:hover:text-ink disabled:text-[#2f353a]`}
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </nav>
  )
}
