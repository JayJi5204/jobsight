import type { ReactNode } from 'react'

/**
 * 금속판. 모든 화면의 칸은 이 판 위에 앉는다.
 *
 * 머리줄은 각인이다 — 제목을 크게 쓰면 판마다 제목이 경쟁해,
 * 정작 봐야 할 것이 생겼을 때 눈이 어디로 가야 할지 모르게 된다.
 *
 * 내용을 감싸지 않고 그대로 둔다. 판 안에서 목록만 스크롤시키려면
 * 자식이 판의 flex 줄에 직접 얹혀야 하기 때문이다.
 */
export function Panel({
  title,
  count,
  action,
  children,
  className = '',
  screws = false,
  grain = true,
}: {
  title?: ReactNode
  /** 머리줄 제목 옆 숫자 */
  count?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  /** 네 귀에 나사를 박는다. 화면을 대표하는 큰 판에만 쓴다 */
  screws?: boolean
  /** 영상을 담은 판에는 결을 넣지 않는다 */
  grain?: boolean
}) {
  return (
    <section
      className={`plate flex min-h-0 flex-col overflow-hidden ${grain ? 'plate-grain' : ''} ${screws ? 'plate-screws' : ''} ${className}`}
    >
      {title && (
        <header className="flex shrink-0 items-center gap-3 border-b border-white/4 px-5 py-4">
          <h2 className="type-eng text-muted">{title}</h2>
          {count !== undefined && count}
          {action && <span className="ml-auto flex items-center gap-1">{action}</span>}
        </header>
      )}
      {children}
    </section>
  )
}
