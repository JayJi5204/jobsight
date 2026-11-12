import type { ReactNode } from 'react'
import { ZoneTree } from '@/components/organisms/ZoneTree'

/**
 * 작업 화면 틀. 왼쪽 기둥 · 작업면 · 오른쪽 칸을 담는다.
 *
 * 왼쪽 기둥은 위에서부터 화면이 넘겨준 칸(aside) · 구역 상태반 · 화면별 칸(left)이다.
 * 구역 반은 기본으로 선다 — 설정을 손보는 중에도 어느 구역이 달아올랐는지는
 * 눈에 들어와야 한다. 녹화처럼 제 폴더에 이미 구역이 한 단으로 들어 있는 화면만
 * zones={false} 로 끈다. 같은 것을 두 번 세우면 둘 중 어느 쪽을 눌러야 할지 모른다.
 *
 * 다만 **기둥이 누우면 구역 반은 빠진다**(.on-wide). 스물다섯 줄을 눕히면 높이만
 * 먹고 글자는 뭉개진다. 그 자리는 실시간 화면의 구역 고르개가 맡는다.
 *
 * 좁으면 위에서 아래로 쌓이고, 넓어지면 차례로 기둥이 된다. 무엇이 언제
 * 일어서는지는 styles/index.css 의 ‘콘솔 배치’ 한 군데에 있다.
 */
export function WorkspaceTemplate({
  left,
  aside,
  right,
  tight = false,
  zones = true,
  className = '',
  children,
}: {
  /** 구역 반 아래에 세울 화면별 칸. 녹화는 폴더 트리를 여기에 넣는다 */
  left?: ReactNode
  /** 구역 반 위에 얹을 칸. 넣으면 좁을 때 기둥이 그만큼 높아진다 */
  aside?: ReactNode
  right?: ReactNode
  /** 작업면이 제 비율만큼만 높이를 갖고, 쌓였을 때 남는 자리를 오른쪽 칸에 넘긴다 */
  tight?: boolean
  /** 구역 반을 세울지. 제 폴더에 구역이 이미 들어 있는 화면만 끈다 */
  zones?: boolean
  /**
   * 배치를 바꾸는 꼬리표. 지금은 녹화만 쓴다 — 기둥을 1024 부터 세우고(`cols-early`),
   * 그보다 좁으면 폴더와 재생기가 자리를 번갈아 쓴다(`pick-one` · `is-picked`).
   * 규칙은 styles/index.css 의 ‘콘솔 배치’ 에 함께 있다.
   */
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`workspace min-h-0 min-w-0 flex-1 ${className}`}>
      <div className={`pane-tree min-h-0 ${aside ? 'has-counters' : ''} ${zones && left ? 'has-two' : ''}`}>
        {aside}
        {zones && <ZoneTree className="pane-list on-wide min-h-0" />}
        {left}
      </div>
      <div className={`workspace-inner min-h-0 min-w-0 flex-1 ${tight ? 'is-tight' : ''}`}>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
        {right}
      </div>
    </div>
  )
}
