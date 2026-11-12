import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/atoms/Icon'

/**
 * 비어 있는 화면. 무엇이 비었는지, 언제 채워지는지, 지금 할 수 있는 일을 말한다.
 * 화면 전체를 맡을 때는 제 판 위에 앉고, 이미 판 안에 들어가 있으면 bare 로 쓴다.
 */
export function EmptyState({
  icon,
  title,
  children,
  action,
  bare = false,
}: {
  icon: IconName
  title: string
  children?: ReactNode
  action?: ReactNode
  /** 이미 판 안에 있을 때. 판을 겹쳐 깔지 않는다 */
  bare?: boolean
}) {
  return (
    <div className={`grid min-h-0 w-full flex-1 place-items-center p-8 ${bare ? '' : 'plate plate-grain'}`}>
      <div className="max-w-md text-center">
        <span className="sunk mx-auto mb-4 grid size-12 place-items-center text-muted">
          <Icon name={icon} size={22} />
        </span>
        <h2 className="type-title">{title}</h2>
        {children && <div className="mt-2 type-caption leading-relaxed text-muted">{children}</div>}
        {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
      </div>
    </div>
  )
}
