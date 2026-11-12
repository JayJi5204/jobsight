import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger' | 'ok'
export type ButtonSize = 'md' | 'sm' | 'lg'

/** 조작부는 색이 아니라 금속으로 구분한다. 색을 쓰면 경보와 자리를 다툰다 */
const BASE =
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border font-medium tracking-[0.06em] transition-colors disabled:cursor-default disabled:opacity-45'

const SIZE: Record<ButtonSize, string> = {
  md: 'h-10 px-4 type-body',
  sm: 'h-8 px-3 type-caption',
  /** 손으로 누르는 자리. 영상 위에 홀로 뜨는 단추처럼 기댈 것이 없을 때 쓴다 */
  lg: 'h-11 px-4 type-body',
}

const ICON_SIZE: Record<ButtonSize, string> = { md: 'h-10 w-10 px-0', sm: 'h-8 w-8 px-0', lg: 'h-11 w-11 px-0' }

const PLATE = '[background-image:var(--btn)] shadow-[var(--btn-shadow)] hover:[background-image:var(--btn-hover)]'

const VARIANT: Record<ButtonVariant, string> = {
  // 가장 밝은 글자와 한 단계 밝은 테두리로 구분한다. 바탕은 같은 판이다
  primary: `border-[#5a646d] font-semibold text-[#edf2f5] ${PLATE}`,
  secondary: `border-line-strong text-ink ${PLATE}`,
  ghost: 'border-transparent text-muted hover:bg-white/5 hover:text-ink',
  quiet: 'border-transparent text-muted hover:bg-white/5 hover:text-ink',
  danger:
    'border-[#ff5a4e] font-semibold text-white [background-image:linear-gradient(180deg,#e03228,#b5231b)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_6px_rgba(0,0,0,0.5)] hover:brightness-110',
  // 초록은 글자와 테두리에만 쓴다. 색면으로 채우면 붉은 경보 화면에서 danger 와 맞선다
  ok: `border-ok/45 font-semibold text-ok ${PLATE}`,
}

/** 모든 화면이 쓰는 버튼. 한 화면에 primary 는 하나만 둔다 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon = false,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; icon?: boolean }) {
  return (
    <button
      type="button"
      className={[BASE, icon ? ICON_SIZE[size] : SIZE[size], VARIANT[variant], className].join(' ')}
      {...rest}
    />
  )
}
