import type { DisplayState } from '@/types/camera'

export const STATE_LABEL: Record<DisplayState, string> = {
  live: '실시간',
  connecting: '연결 중',
  lost: '신호 없음',
  danger: '위험',
  warning: '경고',
  caution: '주의',
  idle: '대기',
}

const SIZE = { sm: 'size-2', md: 'size-2.5', lg: 'size-3' } as const

/**
 * 유리 속 표시등. 꺼져 있는 것이 정상이고 이상일 때만 들어온다.
 *
 * 들어온 등은 안쪽 테두리와 바깥 번짐을 함께 가진다 — 그래야 칠한 점이 아니라
 * 유리알로 보인다. 옆에는 늘 이름이 붙으므로 색만으로 뜻을 지지 않는다.
 */
export function StatusDot({
  state,
  size = 'md',
  className = '',
}: {
  state: DisplayState
  size?: keyof typeof SIZE
  className?: string
}) {
  const tone = {
    live: 'lamp-ok',
    connecting: 'lamp-off',
    lost: 'lamp-empty',
    danger: 'lamp-danger',
    warning: 'lamp-warning',
    caution: 'lamp-caution',
    idle: 'lamp-off',
  }[state]
  return <span aria-hidden className={`inline-block shrink-0 rounded-full ${SIZE[size]} ${tone} ${className}`} />
}
