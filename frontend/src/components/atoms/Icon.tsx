import type { ReactNode } from 'react'

/** 한 굵기(1.6)로 그린 선 아이콘. 글자나 이모지로 아이콘을 대신하지 않는다 */
const PATHS = {
  bell: <path d="M8 2a4.5 4.5 0 0 0-4.5 4.5v2.8L2 11.5h12l-1.5-2.2V6.5A4.5 4.5 0 0 0 8 2ZM6.3 13.5a1.8 1.8 0 0 0 3.4 0" />,
  camera: (
    <>
      <rect x="1.5" y="4" width="9.5" height="8" rx="1.5" />
      <path d="m11 7 3.5-2v6L11 9" />
    </>
  ),
  cameraOff: (
    <>
      <path d="M2 2l12 12" />
      <path d="M11 10.5V12H3a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 3 4M6 4h3.5A1.5 1.5 0 0 1 11 5.5V7l3.5-2v6.5" />
    </>
  ),
  chevronLeft: <path d="m10 3.5-4.5 4.5 4.5 4.5" />,
  chevronRight: <path d="m6 3.5 4.5 4.5L6 12.5" />,
  expand: <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" />,
  collapse: <path d="M13.5 6.5h-4v-4M2.5 9.5h4v4M9.5 6.5l4-4M6.5 9.5l-4 4" />,
  play: <path d="M5 3v10l8-5Z" fill="currentColor" />,
  pause: <path d="M5 3v10M11 3v10" strokeWidth={2.2} />,
  back10: (
    <>
      <path d="M3 4v3.5h3.5" />
      <path d="M3.5 7.2A5 5 0 1 1 4 11" />
    </>
  ),
  fwd10: (
    <>
      <path d="M13 4v3.5H9.5" />
      <path d="M12.5 7.2A5 5 0 1 0 12 11" />
    </>
  ),
  check: <path d="m3 8.5 3 3 7-7" />,
  alert: (
    <>
      <path d="M8 2 14.5 13.5h-13Z" />
      <path d="M8 6.5v3.2M8 11.6v.1" />
    </>
  ),
  gear: (
    <>
      <path d="M2 4.5h3.2M8.4 4.5H14M2 11.5h5.6M10.8 11.5H14" />
      <circle cx="6.8" cy="4.5" r="1.6" />
      <circle cx="9.2" cy="11.5" r="1.6" />
    </>
  ),
  map: <path d="M1.8 4.3 6 2.6v9.1l-4.2 1.7Zm4.2-1.7 4 1.7v9.1l-4-1.7Zm4 1.7 4.2-1.7v9.1L10 13.4Z" />,
  folder: <path d="M2 5a1.3 1.3 0 0 1 1.3-1.3h2.6L7.6 5.4h5.1A1.3 1.3 0 0 1 14 6.7v4.6a1.3 1.3 0 0 1-1.3 1.3H3.3A1.3 1.3 0 0 1 2 11.3Z" />,
  film: (
    <>
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
      <path d="M5 3v10M11 3v10M1.5 6h3.5M1.5 10h3.5M11 6h3.5M11 10h3.5" />
    </>
  ),
  download: <path d="M8 2.5v8M4.8 7.5 8 10.7l3.2-3.2M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS | 'grid1' | 'grid2' | 'grid3' | 'grid4'

function Grid({ n }: { n: number }) {
  const gap = 1.5
  const s = (13 - gap * (n - 1)) / n
  return (
    <g fill="currentColor" stroke="none">
      {Array.from({ length: n * n }, (_, k) => (
        <rect key={k} x={1.5 + (k % n) * (s + gap)} y={1.5 + Math.floor(k / n) * (s + gap)} width={s} height={s} rx={0.8} />
      ))}
    </g>
  )
}

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  const grid = name.startsWith('grid') ? Number(name.slice(4)) : 0
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={['shrink-0', className].filter(Boolean).join(' ')}
    >
      {grid ? <Grid n={grid} /> : PATHS[name as keyof typeof PATHS]}
    </svg>
  )
}
