import { useNavigate } from 'react-router-dom'
import { SEVERITY_COUNT, SEVERITY_LABEL, SEVERITY_ORDER, severityOf } from '@/constants/events'
import { ROUTES } from '@/constants/routes'
import { useEvents } from '@/store/events'

/**
 * 윗줄의 경보 계수기. 아직 확인되지 않은 사건을 단계별로 센다.
 *
 * **날짜를 가리지 않는다.** 오늘 것만 세던 때는 어제 난 미확인이 숫자에서 빠졌다 —
 * 처리가 남은 일은 날이 바뀌었다고 사라지지 않는다. 당직이 바뀌어도 넘겨받을 것이
 * 그대로 보여야 한다.
 *
 * 선교 콘솔의 계수기다 — 0 이면 숫자도 등도 꺼져 있고, 들어온 단계만 켜진다.
 * 당직자가 제일 먼저 봐야 할 숫자라 화면에서 가장 크게 둔다.
 * 폭이 좁아질 때 마지막까지 남는 것이 이 세 숫자다.
 */
export function StatusStrip({ full = false }: { full?: boolean }) {
  const navigate = useNavigate()
  const events = useEvents()

  const pending = events.filter((e) => e.status === 'open')

  return (
    <div className={`flex items-stretch self-stretch ${full ? 'min-w-0 flex-1' : ''}`}>
      {SEVERITY_ORDER.map((level) => {
        const value = pending.filter((e) => severityOf(e.kind) === level).length
        const lit = value > 0
        const label = SEVERITY_LABEL[level]
        return (
          /* 세고 있는 것과 같은 것을 보여 준다 — 오늘, 아직 확인 안 한, 이 단계.
             거르개를 안 걸고 보내면 2 를 눌렀는데 목록에 5 건이 서서,
             어느 숫자가 맞는지 읽는 사람이 따져야 한다 */
          <button
            key={level}
            type="button"
            onClick={() => navigate(`${ROUTES.EVENTS}?severity=${level}`)}
            title={`${label} ${value}건 · 사건 목록에서 보기`}
            className={`flex flex-col items-center justify-center gap-2 border-l border-line transition-colors hover:bg-white/3 ${
              full ? 'min-w-0 flex-1 py-2 first:border-l-0 md:py-3.5' : 'w-22 shrink-0 last:border-r 2xl:w-24 ultra:w-30'
            }`}
          >
            <span className={`type-number ${lit ? SEVERITY_COUNT[level] : 'count-off'}`}>{value}</span>
            {/* 등을 글자 왼쪽에 띄워 둔다. 줄에 끼우면 묶음이 가운데 맞춰져 글자가 숫자보다
                등 너비의 절반만큼 오른쪽으로 밀린다 */}
            <span className="relative flex items-center">
              <span
                aria-hidden
                className={`absolute -left-4 size-2 rounded-full ${lit ? `lamp-${level}` : 'lamp-off'}`}
              />
              <span
                className={`type-caption tracking-[0.22em] whitespace-nowrap ${lit ? 'text-ink' : 'text-muted'} [text-shadow:0_1px_0_rgba(0,0,0,0.9)]`}
              >
                {label}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
