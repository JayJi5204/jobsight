import { useCallback, useEffect } from 'react'
import { STATE_LABEL } from '@/components/atoms/StatusDot'
import { CameraStream } from '@/components/molecules/CameraStream'
import { useClock } from '@/hooks/useClock'
import type { SlotView } from '@/hooks/useZones'
import { clearStreamState, setStreamState, useStreamStates } from '@/store/streamStatus'
import { fmtTime } from '@/utils/time'
import type { CameraState } from '@/types/camera'
import type { Severity } from '@/types/event'

interface Props {
  slot: SlotView
  focused?: boolean
  onToggleFocus?: () => void
}

const ALARMS: readonly Severity[] = ['danger', 'warning', 'caution']

/** 띠의 등. 영상이 들어오는지만 말한다 — 사건은 깜빡이는 테두리가 이미 말하고 있다 */
const DOT: Record<CameraState, string> = {
  live: 'bg-ok shadow-[0_0_8px_rgba(54,201,138,0.7)]',
  connecting: 'bg-[#31373c]',
  lost: 'bg-crit-ink shadow-[0_0_8px_rgba(255,59,47,0.75)]',
  idle: 'bg-[#31373c]',
}

/**
 * 영상 벽의 자리 하나. 영상이 전부이고, 이름과 시각은 영상 위에 띠로 얹는다 —
 * 머리줄을 따로 두면 타일마다 세로를 그만큼 깎아먹는다.
 *
 * **실물이 없는 자리도 같은 타일로 선다.** 빈 칸을 따로 그리면 카메라가 아직
 * 안 붙은 것인지 화면이 덜 그려진 것인지 알 수 없다. 자리는 늘 거기 있고,
 * 거기 영상이 오느냐 안 오느냐만 달라진다.
 *
 * 붙는 중에만 고리를 돌린다. 글자만 두면 멈춰 있는 것으로 읽혀, 기다리면 될
 * 자리에서 카메라가 죽은 줄 안다. 첫 그림을 10초 기다려도 안 오면 신호가 없다고 한다.
 *
 * 누르면 크게, 다시 누르면 제자리로. 단추를 따로 두지 않는 것은 영상 위의 단추가
 * 그만큼 화면을 가리고, 마우스를 올려야 나타나서 손가락으로는 찾을 수 없기 때문이다.
 */
export function CameraTile({ slot, focused = false, onToggleFocus }: Props) {
  const states = useStreamStates()
  const now = useClock()
  const cameraId = slot.cameraId
  const onStateChange = useCallback(
    (s: CameraState) => {
      if (cameraId !== null) setStreamState(cameraId, s)
    },
    [cameraId],
  )
  useEffect(() => {
    if (cameraId === null) return
    return () => clearStreamState(cameraId)
  }, [cameraId])

  // 실물이 없는 자리는 물어볼 데가 없다. 모른다고 하지 않고 없다고 한다
  const stream: CameraState = cameraId === null ? 'lost' : (states.get(cameraId) ?? 'connecting')
  const alarm = ALARMS.find((s) => s === slot.state)
  const connecting = stream === 'connecting'
  const blank = stream !== 'live'

  return (
    <article
      role={onToggleFocus ? 'button' : undefined}
      tabIndex={onToggleFocus ? 0 : undefined}
      aria-pressed={onToggleFocus ? focused : undefined}
      onClick={onToggleFocus}
      onKeyDown={(e) => {
        if (onToggleFocus && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onToggleFocus()
        }
      }}
      aria-label={`${slot.label}, ${STATE_LABEL[alarm ?? stream]}${onToggleFocus ? (focused ? '. 누르면 전체 보기로 돌아갑니다' : '. 누르면 크게 봅니다') : ''}`}
      className={`@container relative h-full w-full overflow-hidden rounded border-2 border-transparent bg-black ${
        onToggleFocus ? 'cursor-pointer' : ''
      } ${alarm ? `camera-alert-${alarm}` : ''}`}
    >
      {slot.streamKey !== null && <CameraStream streamKey={slot.streamKey} onStateChange={onStateChange} />}

      {blank && (
        <div className="absolute inset-0 grid place-items-center bg-ground">
          <span className="flex flex-col items-center gap-3">
            {connecting && <span className="size-7 animate-spin rounded-full border-2 border-line border-t-muted" />}
            <span className="type-caption tracking-[0.2em] text-[#31373c]">{connecting ? '연결 중' : '신호 없음'}</span>
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/85 to-transparent px-3 py-2">
        <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${DOT[stream]}`} />
        <span className="min-w-0 truncate type-caption tracking-[0.14em] text-[#aeb7be]">{slot.label}</span>
        {/* 칸이 좁아지면 시각을 거둔다. 이름과 시각이 자리를 다투면 먼저 밀리는 것이 이름인데,
            어느 카메라인지가 몇 시인지보다 먼저다. 시각은 윗줄 시계가 이미 말하고 있다.
            화면 폭이 아니라 **칸 폭**으로 정한다 — 4×4 로 나누면 넓은 화면에서도 칸은 좁다 */}
        <span className="ml-auto shrink-0 type-caption text-[#8a939a] tabular-nums @max-2xs:hidden">{fmtTime(now)}</span>
      </div>

    </article>
  )
}
