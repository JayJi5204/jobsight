import type { IconName } from '@/components/atoms/Icon'

export const ROUTES = {
  LIVE: '/',
  RECORDINGS: '/recordings',
  EVENTS: '/events',
  MAP: '/map',
  SETTINGS: '/settings',
} as const

/** 화면 이동. VMS 의 익숙한 순서 — 보기, 되돌려 보기, 사건, 설정. 휴대폰에서는 아래 탭이 된다 */
export const NAV: readonly { to: string; label: string; icon: IconName }[] = [
  { to: ROUTES.LIVE, label: '실시간', icon: 'grid2' },
  { to: ROUTES.RECORDINGS, label: '녹화', icon: 'film' },
  { to: ROUTES.EVENTS, label: '사건', icon: 'bell' },
  { to: ROUTES.MAP, label: '지도', icon: 'map' },
  { to: ROUTES.SETTINGS, label: '설정', icon: 'gear' },
]
