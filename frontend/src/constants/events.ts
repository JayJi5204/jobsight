import type { EventKind, Severity } from '@/types/event'

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  fall: '추락',
  fire: '화재',
  intrusion: '침입',
  loitering: '배회',
}

/**
 * 종류가 단계를 정한다.
 *
 * 추락과 화재는 사람이 지금 다치고 있는 일이라 위험,
 * 침입은 사람을 불러 확인해야 하는 일이라 경고,
 * 배회는 지켜보다 아니면 마는 일이라 주의다.
 */
export const SEVERITY_OF: Record<EventKind, Severity> = {
  fall: 'danger',
  fire: 'danger',
  intrusion: 'warning',
  loitering: 'caution',
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  danger: '위험',
  warning: '경고',
  caution: '주의',
}

/** 급한 순서. 세는 자리도 보여 주는 자리도 이 순서를 따른다 */
export const SEVERITY_ORDER: readonly Severity[] = ['danger', 'warning', 'caution']

/** 어두운 바탕 위 글자색. 채움용 crit 은 흰 글자와 맞추느라 어두워 글자로 못 쓴다 */
export const SEVERITY_TEXT: Record<Severity, string> = {
  danger: 'text-crit-ink',
  warning: 'text-warn',
  caution: 'text-caution',
}

/** 등의 색. 바탕을 칠하는 자리다 */
export const SEVERITY_LAMP: Record<Severity, string> = {
  danger: 'bg-crit',
  warning: 'bg-warn',
  caution: 'bg-caution',
}

export const eventLabel = (kind: EventKind): string => EVENT_KIND_LABEL[kind]

export const severityOf = (kind: EventKind): Severity => SEVERITY_OF[kind]

/** 단계로 칠한 면과 그 위의 글자. 빨강 위는 흰 글자, 주황·노랑 위는 어두운 글자다 */
export const SEVERITY_FILL: Record<Severity, string> = {
  danger: 'bg-crit text-white',
  warning: 'bg-warn text-ground',
  caution: 'bg-caution text-ground',
}



/**
 * 경보 칸 줄의 바탕. 단계마다 달라야 위험이 경고와 같은 색으로 묻히지 않는다.
 * 표에는 깔지 않는다 — 열여덟 줄이 모두 칠해져 있으면 한 줄이 달아올라도 알아볼 수 없다.
 */
export const SEVERITY_ROW: Record<Severity, string> = {
  danger: 'bg-crit-ink/10',
  warning: 'bg-warn/6',
  caution: 'bg-caution/6',
}

/** 큰 계수기의 숫자. 0 이면 판에 각인된 채 꺼져 있다 */
export const SEVERITY_COUNT: Record<Severity, string> = {
  danger: 'count-danger',
  warning: 'count-warning',
  caution: 'count-caution',
}
