import { SEVERITY_LAMP, eventLabel, severityOf } from '@/constants/events'
import type { DetectionEvent } from '@/types/event'
import type { RecordingSegment } from '@/types/recording'
import { fmtTime } from '@/utils/time'

const HOUR_MS = 3_600_000
const MARKS = ['00분', '15분', '30분', '45분', '60분']

interface Props {
  /** 이 띠가 덮는 한 시간의 시작 */
  hourStart: number
  segments: RecordingSegment[]
  events: DetectionEvent[]
  /** 지금 열어 둔 구간 */
  windowStart: number
  windowMs: number
  onSeek: (ms: number) => void
}

const pct = (ms: number) => `${(ms / HOUR_MS) * 100}%`

/**
 * 지금 보는 녹화가 속한 한 시간.
 *
 * 하루를 통째로 그리면 5분짜리 구간이 전체의 0.3% 라 눈에 걸리지 않는다.
 * 한 시간이면 같은 구간이 1/12 를 차지해 어디를 보고 있는지가 읽힌다.
 *
 * **띄는 읽는 것이지 누르는 것이 아니다.** 눌러 옮기게 해 두었더니 띄가 12px 이라
 * 짚은 자리가 몇 분인지 보이지 않은 채 영상만 갈아끼워졌다. 시각을 옮기는 길은
 * 왼쪽 폴더(5분 구간)와 ±10초이고, 이 띄에서 누를 수 있는 것은 사건 표식뿐이다.
 */
export function HourTimeline({ hourStart, segments, events, windowStart, windowMs, onSeek }: Props) {
  const hourEnd = hourStart + HOUR_MS
  const hour = new Date(hourStart).getHours()

  const bars = segments
    .map((s) => [Date.parse(s.start), Date.parse(s.end)] as const)
    .filter(([a, b]) => b > hourStart && a < hourEnd)
    .map(([a, b]) => ({ from: Math.max(a, hourStart) - hourStart, to: Math.min(b, hourEnd) - hourStart }))

  const marks = events.filter((e) => {
    const t = Date.parse(e.detectedAt)
    return t >= hourStart && t < hourEnd
  })

  return (
    <div className="grid shrink-0 gap-1 select-none">
      <span className="type-caption text-muted tabular-nums">{hour}시 타임라인</span>

      <div className="sunk relative h-3">
        {bars.map((b) => (
          <span
            key={b.from}
            aria-hidden
            className="absolute top-0 bottom-0 bg-accent/70"
            style={{ left: pct(b.from), width: pct(b.to - b.from) }}
          />
        ))}

        {marks.map((e) => {
          const at = Date.parse(e.detectedAt) - hourStart
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onSeek(Date.parse(e.detectedAt) - 10_000)}
              title={`${eventLabel(e.kind)} ${fmtTime(new Date(e.detectedAt))}`}
              className={`absolute top-0.5 bottom-0.5 w-[3px] rounded-[1px] ${SEVERITY_LAMP[severityOf(e.kind)]} ${
                e.status === 'OPEN' ? '' : 'opacity-55'
              }`}
              style={{ left: pct(at) }}
            />
          )
        })}

        {/* 지금 보고 있는 녹화 구간 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-0.5 -bottom-0.5 rounded-[2px] border border-ink"
          style={{
            left: pct(Math.max(0, windowStart - hourStart)),
            width: `max(0.8%, ${(windowMs / HOUR_MS) * 100}%)`,
          }}
        />
      </div>

      <div className="flex justify-between type-caption text-muted tabular-nums">
        {MARKS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  )
}
