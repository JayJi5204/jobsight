import { fmtDayFull } from '@/utils/time'

/**
 * 날이 바뀌는 자리에만 세우는 구분줄.
 *
 * 시·분만 적으면 자정을 넘긴 줄이 같은 날처럼 읽힌다. 모든 줄에 날짜를 붙이면
 * 같은 말이 스무 번 반복돼 정작 시각이 묻히므로, 바뀌는 자리에만 세운다.
 * 판 사이의 어둠과 같은 검정을 깔아 목록 줄과 갈라 놓는다.
 */
export function DayDivider({ at }: { at: string | number | Date }) {
  return (
    <div className="flex items-center gap-3 bg-ground px-3 py-2">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <span className="type-eng text-muted">{fmtDayFull(new Date(at))}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  )
}
