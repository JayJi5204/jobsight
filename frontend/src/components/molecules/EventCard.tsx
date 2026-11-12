import { SEVERITY_LABEL, SEVERITY_ROW, SEVERITY_TEXT, eventLabel, severityOf } from '@/constants/events'
import { StatusDot } from '@/components/atoms/StatusDot'
import type { DetectionEvent } from '@/types/event'
import { fmtHM } from '@/utils/time'

interface Props {
  event: DetectionEvent
  cameraLabel: string
  onOpen: () => void
}

/**
 * 경보 한 줄. 등 · 시각 · 단계와 유형이 윗줄, 어디서 났는지가 아랫줄이다.
 *
 * 등은 확인이 남은 줄에만 들어온다. 처리한 줄까지 켜 두면 열 줄이 모두 켜져
 * 지금 손이 필요한 것이 어느 줄인지 읽히지 않는다.
 *
 * 등 · 바탕 · 글자가 **같은 단계색**을 쓴다. 등은 노란데 글자는 주황이면 한 줄 안에서
 * 색이 어긋나, 이 줄이 주의인지 경고인지를 색으로 읽을 수 없다.
 *
 * 여기서 확인 처리를 하지 않는다 — 처리하려면 무엇이 찍혔는지 봐야 하는데
 * 이 칸에는 영상도 탐지 네모도 없다. 줄을 누르면 그 카메라를 크게 띄운다.
 */
export function EventCard({ event, cameraLabel, onOpen }: Props) {
  const level = severityOf(event.kind)
  const pending = event.status === 'OPEN'

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`grid w-full grid-cols-[auto_auto_1fr] items-start gap-3 px-5 py-3.5 text-left transition-colors ${
        pending ? SEVERITY_ROW[level] : 'hover:bg-white/3'
      }`}
    >
      <StatusDot state={pending ? level : 'idle'} className="mt-1" />
      <span className="mt-0.5 type-caption text-muted tabular-nums">{fmtHM(new Date(event.detectedAt))}</span>
      <span className="min-w-0">
        <span className={`block truncate type-body ${pending ? `font-semibold ${SEVERITY_TEXT[level]}` : 'text-muted'}`}>
          {SEVERITY_LABEL[level]} · {eventLabel(event.kind)}
        </span>
        <span className="mt-1.5 block truncate type-caption text-[#5c656c]">{cameraLabel}</span>
      </span>
    </button>
  )
}
