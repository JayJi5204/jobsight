import type { ReactNode } from 'react'
import { EVENT_KIND_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, severityOf } from '@/constants/events'
import { useZones } from '@/hooks/useZones'
import type { EventKind, Severity } from '@/types/event'
import { DAY_END_HOUR, HOURS_IN_DAY, hourText } from '@/utils/distribution'

export interface EventFilter {
  /** `yyyy-mm-dd`. 날짜 입력칸이 그대로 쓰는 꼴이다 */
  from: string
  to: string
  /** 시간대. 끝은 포함하지 않는다 — `09:00~10:00` 이 한 시간이다 */
  hourFrom: number
  hourTo: number
  kind: EventKind | 'all'
  severity: Severity | 'all'
  /** 어느 구역인가. 'all' 이면 서울 전체 */
  zoneId: number | 'all'
  /** 그 구역의 어느 자리인가. 자리 이름(CAM-014)으로 집는다 */
  slotKey: string | 'all'
  /** 손이 남았는가. 윗줄 계수기가 세는 것은 'open' 뿐이다 */
  status: 'all' | 'open' | 'done'
}

const STATUS_LABEL: Record<EventFilter['status'], string> = {
  all: '전체 상태',
  open: '미확인만',
  done: '확인함만',
}

const KINDS = Object.keys(EVENT_KIND_LABEL) as EventKind[]
const HOUR_STARTS = Array.from({ length: HOURS_IN_DAY }, (_, h) => h)
const HOUR_ENDS = Array.from({ length: HOURS_IN_DAY }, (_, h) => h + 1)

const FIELD = 'h-9 rounded-sm border border-line-strong bg-panel px-3 type-body text-ink tabular-nums outline-none [color-scheme:dark] focus:border-[#5a646d]'

interface Props {
  value: EventFilter
  onChange: (next: EventFilter) => void
  /**
   * 어디서 고르개(구역 · 카메라)를 세운다.
   *
   * 분포에서는 세우지 않는다 — 격자의 줄이 곧 카메라라 같은 것을 두 번 묻는 꼴이다.
   * 목록에서는 칸 하나로 좁혀 들어온 범위를 다시 넓힐 유일한 길이라 세운다.
   */
  hasCamera: boolean
}

/**
 * 사건 거르개.
 *
 * 묻는 순서대로 줄을 나눈다 — 어디서(카메라) · 언제(기간 · 시간대) ·
 * 무슨 일인가(카테고리) · 얼마나 급한가(경보).
 *
 * 넓으면 칩을 늘어놓아 한눈에 고르게 하고, 좁으면 접어 세운다. 칩으로 늘어놓으면
 * 390px 에서 다섯 줄이 되어 목록보다 거르개가 길어진다. 접힌 글자가 지금 무엇으로
 * 걸러져 있는지를 그대로 말해 주므로 `전체` 가 아니라 `모든 카테고리` 로 적는다.
 */
export function EventFilterBar({ value, onChange, hasCamera }: Props) {
  const rows = useZones()
  const set = (patch: Partial<EventFilter>) => onChange({ ...value, ...patch })
  const picked = value.zoneId === 'all' ? null : (rows.find((r) => r.zone.id === value.zoneId) ?? null)

  /**
   * 카테고리와 경보는 같은 것을 굵게·가늘게 묻는 것이다 — 화재는 그 자체로 위험이고,
   * 경보는 종류를 세 묶음으로 묶은 이름일 뿐이다. 그래서 겹치지 않는 둘(화재에 주의)을
   * 양쪽에서 함께 막는다. 한쪽만 막으면 주의를 먼저 누르고 화재를 고르는 길이 남는다.
   */
  const kindPickable = (kind: EventKind) => value.severity === 'all' || severityOf(kind) === value.severity
  const severityPickable = (level: Severity) => value.kind === 'all' || severityOf(value.kind) === level

  /**
   * 어디서 — 구역을 먼저 고르고 그 안에서 카메라를 고른다.
   *
   * 한 고르개에 오백 대를 늘어놓으면 찾는 자리까지 굴려 내려가야 한다.
   * 둘로 나누면 스물다섯 중 하나, 다시 스무 중 하나다.
   * 구역을 안 고른 동안 카메라 고르개는 잠가 둔다 — 열어 봐야 고를 것이 없다.
   */
  const wherePicker = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="구역 선택"
        value={String(value.zoneId)}
        onChange={(e) =>
          set({ zoneId: e.target.value === 'all' ? 'all' : Number(e.target.value), slotKey: 'all' })
        }
        className={`${FIELD} max-lg:w-full`}
      >
        <option value="all">모든 구역</option>
        {rows.map((r) => (
          <option key={r.zone.id} value={r.zone.id}>
            {r.zone.name}
          </option>
        ))}
      </select>
      <select
        aria-label="카메라 선택"
        value={value.slotKey}
        disabled={picked === null}
        onChange={(e) => set({ slotKey: e.target.value })}
        className={`${FIELD} max-lg:w-full disabled:text-muted`}
      >
        <option value="all">모든 카메라</option>
        {picked?.slots.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-white/5 px-4 py-3">
      {hasCamera && wherePicker}

      {/* 기간과 시간대는 한 줄이다. 둘 다 '언제' 를 묻는 것이라 떼어 놓으면 서로 다른 질문처럼 보인다.
          끝 시각을 24:00 까지 두는 것은 하루 전체를 적을 수 있어야 하기 때문이고,
          끝이 시작보다 빠르면 자정을 넘긴 구간(야간 당직 22:00~06:00)이 된다 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          aria-label="시작 날짜"
          value={value.from}
          onChange={(e) => set({ from: e.target.value })}
          className={FIELD}
        />
        <span className="text-muted">~</span>
        <input type="date" aria-label="끝 날짜" value={value.to} onChange={(e) => set({ to: e.target.value })} className={FIELD} />
        <span className="w-2" />
        <select
          aria-label="시작 시각"
          value={String(value.hourFrom)}
          onChange={(e) => set({ hourFrom: Number(e.target.value) })}
          className={FIELD}
        >
          {HOUR_STARTS.map((h) => (
            <option key={h} value={h}>
              {hourText(h)}
            </option>
          ))}
        </select>
        <span className="text-muted">~</span>
        <select
          aria-label="끝 시각"
          value={String(value.hourTo)}
          onChange={(e) => set({ hourTo: Number(e.target.value) })}
          className={FIELD}
        >
          {HOUR_ENDS.map((h) => (
            <option key={h} value={h}>
              {hourText(h === DAY_END_HOUR ? DAY_END_HOUR : h)}
            </option>
          ))}
        </select>

        {/* 처리 여부는 단계·종류와 다른 축이라 칩으로 늘어놓지 않고 고르개 하나로 둔다.
            "아직 안 본 것만" 은 자주 쓰는 길이라 늘 보이는 이 줄에 있어야 한다 */}
        <select
          aria-label="확인 상태 선택"
          value={value.status}
          onChange={(e) => set({ status: e.target.value as EventFilter['status'] })}
          className={`${FIELD} ml-auto`}
        >
          {(Object.keys(STATUS_LABEL) as EventFilter['status'][]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {/* 넓은 화면: 칩을 늘어놓는다 */}
      <div className="flex flex-wrap items-center gap-2 max-lg:hidden">
        <Pick active={value.kind === 'all'} onClick={() => set({ kind: 'all' })}>
          전체
        </Pick>
        {KINDS.map((k) => (
          <Pick key={k} active={value.kind === k} disabled={!kindPickable(k)} onClick={() => set({ kind: k })}>
            {EVENT_KIND_LABEL[k]}
          </Pick>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 max-lg:hidden">
        <Pick active={value.severity === 'all'} onClick={() => set({ severity: 'all' })}>
          전체
        </Pick>
        {SEVERITY_ORDER.map((s) => (
          <Pick key={s} active={value.severity === s} disabled={!severityPickable(s)} onClick={() => set({ severity: s })}>
            {SEVERITY_LABEL[s]}
          </Pick>
        ))}
      </div>

      {/* 좁은 화면: 접어 세운다 */}
      <select
        aria-label="카테고리 선택"
        value={value.kind}
        onChange={(e) => set({ kind: e.target.value === 'all' ? 'all' : (e.target.value as EventKind) })}
        className={`${FIELD} w-full lg:hidden`}
      >
        <option value="all">모든 카테고리</option>
        {KINDS.map((k) => (
          <option key={k} value={k} disabled={!kindPickable(k)}>
            {EVENT_KIND_LABEL[k]}
          </option>
        ))}
      </select>
      <select
        aria-label="경보 선택"
        value={value.severity}
        onChange={(e) => set({ severity: e.target.value === 'all' ? 'all' : (e.target.value as Severity) })}
        className={`${FIELD} w-full lg:hidden`}
      >
        <option value="all">모든 경보</option>
        {SEVERITY_ORDER.map((s) => (
          <option key={s} value={s} disabled={!severityPickable(s)}>
            {SEVERITY_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  )
}

/** 고른 것만 금속으로 올라온다. 나머지는 바탕에 눕는다 */
function Pick({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center justify-center rounded-sm border px-4 type-body whitespace-nowrap transition-colors ${
        disabled
          ? 'cursor-not-allowed border-line/60 text-[#4d555b]'
          : active
            ? 'border-[#5a646d] text-[#edf2f5] [background-image:var(--btn)] shadow-[var(--btn-shadow)]'
            : 'border-line text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
