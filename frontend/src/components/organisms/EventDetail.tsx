import { useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { RecordingPlayer } from '@/components/molecules/RecordingPlayer'
import { eventLabel, SEVERITY_LABEL, SEVERITY_TEXT, severityOf } from '@/constants/events'
import type { DetectionEvent } from '@/types/event'
import { fmtTime } from '@/utils/time'

interface Props {
  event: DetectionEvent
  cameraLabel: string
  streamKey: string
  /** 구역. 아직 정해지지 않았으면 '—' */
  zone: string
  onBack: () => void
  onAck: () => void
  onRecording: () => void
}

/** 2분 36초 · 41초 */
const lasted = (ms: number): string => {
  const sec = Math.max(1, Math.round(ms / 1000))
  if (sec < 60) return `${sec}초`
  return `${Math.floor(sec / 60)}분 ${sec % 60}초`
}

/** 2026.11.05 */
const dotDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`

/** 00:00 / 02:36 */
const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

/**
 * 사건 하나. 무엇이 찍혔는지를 먼저 보여 주고, 아래에 판단에 필요한 사실만 줄로 적는다.
 *
 * 영상은 녹화 재생 서버에서 그 시각 그 길이만큼 받아 온다 — 사건마다 따로 저장하지 않는다.
 * 모델과 판정을 함께 적는 것은, 틀린 경보를 가릴 때 무엇이 그렇게 말했는지가 근거이기 때문이다.
 */
export function EventDetail({ event, cameraLabel, streamKey, zone, onBack, onAck, onRecording }: Props) {
  const [playing, setPlaying] = useState(false)
  const [at, setAt] = useState(() => Date.parse(event.detectedAt))

  const level = severityOf(event.kind)
  const start = Date.parse(event.detectedAt)
  const end = event.endedAt ? Date.parse(event.endedAt) : start
  const spanMs = Math.max(1000, end - start)
  const pending = event.status === 'OPEN'

  const verdict = event.confidence != null ? `${eventLabel(event.kind)} ${event.confidence.toFixed(2)}` : null

  return (
    <>
      {/* 돌아가는 길은 상세가 표를 덮은 폭에만 있다. 표가 옆에 서 있으면 돌아갈 데가
          없어서, 눌러도 아무 일이 안 일어나는 단추가 머리줄을 지키고 있게 된다 */}
      <div className="flex shrink-0 items-center justify-end border-b border-white/5 px-3 py-2 xl:hidden">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="chevronLeft" /> 목록으로
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col">
        {/* 칸이 넓고 낮을 때(기둥이 누운 폭) 16:9 를 그대로 쓰면 영상 하나가 칸을 다 먹어
            날짜·위치·판정이 굴려야 나온다. 높이를 묶고 그림은 안에서 맞춘다 */}
        <div className="relative aspect-video max-h-[40dvh] bg-black">
          <RecordingPlayer
            key={`${streamKey}-${start}`}
            streamKey={streamKey}
            srcStart={start}
            durationSec={spanMs / 1000}
            playing={playing}
            rate={1}
            onProgress={setAt}
            onEnded={() => setPlaying(false)}
          />
          {/* 모델이 무엇으로 봤는지. 탐지 네모의 자리는 아직 백엔드가 주지 않는다 */}
          {verdict && (
            <span className="pointer-events-none absolute top-3 left-3 rounded-sm bg-caution px-2 py-0.5 type-caption font-bold text-ground">
              {verdict}
            </span>
          )}
        </div>

        {/* 재생 줄 */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-black px-3 py-2">
          <Button variant="quiet" icon aria-label="10초 뒤로" onClick={() => setAt(Math.max(start, at - 10_000))}>
            <Icon name="chevronLeft" size={16} />
          </Button>
          <Button variant="quiet" icon aria-label={playing ? '일시 정지' : '재생'} onClick={() => setPlaying(!playing)}>
            <Icon name={playing ? 'pause' : 'play'} size={16} />
          </Button>
          <Button variant="quiet" icon aria-label="10초 앞으로" onClick={() => setAt(Math.min(end, at + 10_000))}>
            <Icon name="chevronRight" size={16} />
          </Button>
          <span className="type-caption text-muted tabular-nums">
            {clock((at - start) / 1000)} / {clock(spanMs / 1000)}
          </span>
        </div>

        <div className="grid gap-4 p-4">
          {/* 확인 상태는 머리줄에 적지 않는다 — 바로 아래 '확인 상태' 칸이 말한다.
              한 화면에 같은 말이 두 번 있으면 어느 쪽이 더 최근인지 읽는 사람이 따져야 한다 */}
          <h3 className={`type-title font-bold ${SEVERITY_TEXT[level]}`}>
            {SEVERITY_LABEL[level]} · {eventLabel(event.kind)}
          </h3>

          <dl className="type-caption">
            <Row label="날짜">{dotDate(new Date(start))}</Row>
            <Row label="발생 시각">
              {fmtTime(new Date(start))} ~ {fmtTime(new Date(end))} ({lasted(spanMs)})
            </Row>
            <Row label="위치">{zone}</Row>
            <Row label="카메라">{cameraLabel}</Row>
            <Row label="확인 상태">
              <span className={`font-semibold ${pending ? 'text-warn' : 'text-ok'}`}>{pending ? '미확인' : '확인함'}</span>
            </Row>
            <Row label="모델">{event.model ?? '—'}</Row>
            <Row label={`${event.model ?? '모델'} 판정`}>{verdict ?? '—'}</Row>
          </dl>

        </div>

        {/* 조치는 맨 아래 한 줄. 왼쪽 끝은 자리를 옮기는 것, 오른쪽 끝은 이 사건을 끝내는 것이다.
            섮어 두면 되돌릴 수 없는 처리를 옆에 있는 단추로 착각해 누른다.

            지난 사건에서 라이브로 가 봐야 그때 일은 이미 지나갔다. 갈 곳은 녹화다 */}
        <div className="mt-auto flex flex-wrap items-center gap-2 p-4 pt-6">
          <Button onClick={onRecording}>
            <Icon name="film" /> 녹화에서 보기
          </Button>
          <span className="flex-1" />
          {/* 초록은 글자와 테두리에만 쓴다. 색면으로 채우면 붉은 경보 화면에서 danger 와 맞선다 */}
          {pending && (
            <Button variant="ok" onClick={onAck}>
              <Icon name="check" /> 확인
            </Button>
          )}
        </div>
        </div>
      </div>
    </>
  )
}

/** 이름은 왼쪽, 값은 오른쪽 끝. 값이 한 줄에 세로로 맞아야 훑어 읽힌다 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/4 py-2.5 last:border-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right tabular-nums">{children}</dd>
    </div>
  )
}
