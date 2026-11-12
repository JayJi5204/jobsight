import type { ReactNode } from 'react'

export interface SegmentOption<T> {
  value: T
  label: ReactNode
  /** 아이콘만 보일 때 읽어 줄 이름 */
  title?: string
}

const SIZE = { sm: 'h-6', md: 'h-9' } as const

/**
 * 한 묶음 안에서 하나 고르기. 판에 파인 홈 안에서 고른 것만 금속으로 올라온다 —
 * 색이 아니라 높이로 구분하므로 경보의 색과 다투지 않는다.
 */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  size = 'sm',
  className = '',
}: {
  value: T
  options: readonly SegmentOption<T>[]
  onChange: (value: T) => void
  label: string
  size?: keyof typeof SIZE
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex shrink-0 gap-0.5 rounded-sm border border-line p-0.5 shadow-[var(--sunk)] ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            aria-label={o.title}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-[3px] px-2.5 type-caption whitespace-nowrap transition-colors tabular-nums ${SIZE[size]} ${
              active
                ? 'border border-[#5a646d] font-semibold text-[#edf2f5] [background-image:var(--btn)] shadow-[var(--btn-shadow)]'
                : 'border border-transparent text-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
