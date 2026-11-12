import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventLabel, SEVERITY_LABEL, SEVERITY_ROW, SEVERITY_TEXT, severityOf } from '@/constants/events'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusDot } from '@/components/atoms/StatusDot'
import { Segmented } from '@/components/atoms/Segmented'
import { EmptyState } from '@/components/molecules/EmptyState'
import { RecordingPlayer } from '@/components/molecules/RecordingPlayer'
import { HourTimeline } from '@/components/organisms/HourTimeline'
import { RecordingTree } from '@/components/organisms/RecordingTree'
import { WorkspaceTemplate } from '@/components/templates/WorkspaceTemplate'
import { useCameras } from '@/hooks/useCameras'
import { useClock } from '@/hooks/useClock'
import { useRecordingSegments } from '@/hooks/useRecordingSegments'
import { useEvents } from '@/store/events'
import type { RecordingSegment } from '@/types/recording'
import { fmtDateTime, fmtTime, sameDay, startOfDay } from '@/utils/time'

const HOUR_MS = 3_600_000
/** 녹화는 5분 단위로 저장이 끝난 것만 목록에 오른다. 방금 지난 시각은 아직 없다 */
const INDEX_LAG_MS = 90_000

/** 04:59. 구간이 5분이라 시는 쓰지 않는다 */
const mmss = (sec: number) => {
  const whole = Math.max(0, Math.floor(sec))
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

const spanOf = (s: RecordingSegment) => [Date.parse(s.start), Date.parse(s.end)] as const
const segmentAt = (segments: RecordingSegment[], t: number) => segments.find((s) => t >= Date.parse(s.start) && t < Date.parse(s.end))
const nextSegmentAfter = (segments: RecordingSegment[], t: number) =>
  segments.filter((s) => Date.parse(s.start) > t).sort((a, b) => a.start.localeCompare(b.start))[0]

/** 11월 11일 */
const monthDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`

/**
 * 녹화. 왼쪽 폴더에서 날짜 · 카메라 · 시 · 구간을 짚어 되돌려 본다.
 *
 * 구간 목록은 GET /api/recordings 에서, 영상은 MediaMTX 재생 서버에서 직접 받는다.
 * 시각 이동은 영상 안에서 감는 것이 아니라 그 시각부터 새로 열어 달라고 요청하는 것이다.
 */
export function RecordingsPage() {
  const { status, cameras, error } = useCameras()
  const events = useEvents()
  const [params] = useSearchParams()
  const clock = useClock(5000)
  const now = clock.getTime()

  const initialT = Date.parse(params.get('t') ?? '')
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(params.get('camera')) || null)
  /**
   * 폴더에서 구간을 짚었는가. **좁은 폭에서만** 뜻이 있다 — 거기서는 폴더와 재생기가
   * 자리를 번갈아 쓰므로, 짚기 전에는 폴더가 화면을 다 쓴다.
   *
   * 사건에서 '녹화에서 보기' 로 들어오면 이미 짚고 들어온 것이라 재생기부터 연다.
   */
  const [picked, setPicked] = useState(() => Number(params.get('camera')) > 0)
  const [playhead, setPlayhead] = useState(() => (Number.isFinite(initialT) ? initialT - 10_000 : Date.now() - 10 * 60_000))
  /** 지금 열어 둔 영상이 시작하는 시각. 이 값이 바뀔 때만 영상을 새로 연다 */
  const [srcStart, setSrcStart] = useState(playhead)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState<1 | 2 | 4>(1)

  const camera = cameras.find((c) => c.id === selectedId) ?? cameras[0]
  const dayStart = startOfDay(new Date(playhead)).getTime()
  const rec = useRecordingSegments(camera?.id, dayStart)
  const segments = rec.status === 'ready' ? rec.segments : []

  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => e.cameraId === camera?.id && sameDay(new Date(e.detectedAt), new Date(dayStart)))
        .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)),
    [events, camera, dayStart],
  )

  // 카메라를 바꾸면 그 자리에서 다시 연다
  useEffect(() => {
    setPlaying(false)
    setSrcStart(playhead)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 카메라가 바뀔 때만
  }, [camera?.id])

  if (status === 'loading') return <p className="plate grid flex-1 place-items-center type-body text-muted">카메라 목록을 받는 중…</p>
  if (status === 'error') {
    return (
      <EmptyState icon="alert" title="카메라 목록을 불러오지 못했습니다">
        <p>서버와 연결되지 않았습니다. 잠시 후 자동으로 다시 시도합니다.</p>
        {error && <p className="mt-3 type-caption text-muted/80">{error}</p>}
      </EmptyState>
    )
  }
  if (!camera) return <EmptyState icon="camera" title="등록된 카메라가 없습니다" />
  if (rec.status === 'unavailable') {
    return (
      <EmptyState icon="film" title="녹화가 아직 연결되지 않았습니다">
        녹화 저장소가 준비되면 카메라별로 녹화된 구간이 폴더와 타임라인에 나타나고, 원하는 시각으로 돌아가 볼 수 있습니다.
      </EmptyState>
    )
  }
  if (rec.status === 'unknown-camera') {
    return (
      <EmptyState icon="alert" title="서버가 이 카메라를 모릅니다">
        목록을 받은 뒤 카메라가 지워졌을 수 있습니다. go2rtc 설정과 카메라 등록 상태를 확인하세요.
      </EmptyState>
    )
  }

  const current = segmentAt(segments, playhead)
  const openSegment = segmentAt(segments, srcStart)
  const seek = (ms: number) => {
    const t = Math.min(ms, now)
    setPlayhead(t)
    setSrcStart(t)
  }
  const onEnded = () => {
    const next = nextSegmentAfter(segments, playhead)
    if (next) seek(Date.parse(next.start))
    else setPlaying(false)
  }

  // 이 구간을 어디까지 봤나. 구간은 5분이라 분·초면 충분하다
  const totalSec = openSegment ? Math.max(1, (spanOf(openSegment)[1] - srcStart) / 1000) : 0
  const atSec = Math.max(0, Math.min(totalSec, (playhead - srcStart) / 1000))

  const hourStart = Math.floor(playhead / HOUR_MS) * HOUR_MS
  const windowMs = openSegment ? spanOf(openSegment)[1] - Math.max(spanOf(openSegment)[0], srcStart) : 0

  let screen
  if (rec.status === 'loading')
    screen = (
      <Notice>
        <span className="inline-flex items-center gap-2">
          녹화 구간을 불러오는 중
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-muted" />
        </span>
      </Notice>
    )
  else if (rec.status === 'error') screen = <Notice tone="warn">{rec.message}</Notice>
  else if (openSegment) {
    screen = (
      <RecordingPlayer
        key={`${camera.streamKey}-${srcStart}`}
        streamKey={camera.streamKey}
        srcStart={srcStart}
        durationSec={Math.max(1, (spanOf(openSegment)[1] - srcStart) / 1000)}
        playing={playing}
        rate={rate}
        onProgress={setPlayhead}
        onEnded={onEnded}
      />
    )
  } else if (now - playhead < INDEX_LAG_MS) {
    screen = (
      <Notice>
        <b className="text-ink">가장 최근 구간은 아직 저장 중입니다</b>
        지금 장면은 실시간 화면에서 볼 수 있습니다.
      </Notice>
    )
  } else {
    screen = (
      <Notice>
        <b className="text-ink">이 시각에는 녹화가 없습니다</b>
        {segments.length ? '왼쪽 폴더나 아래 타임라인에서 녹화된 시각으로 옮기세요.' : '이 날은 녹화된 구간이 없습니다.'}
      </Notice>
    )
  }

  return (
    <WorkspaceTemplate
      zones={false}
      className={`cols-early pick-one ${picked ? 'is-picked' : ''}`}
      left={
        <RecordingTree
          className="pane-list min-h-0"
          cameraId={camera.id}
          playhead={playhead}
          onPick={(id, at) => {
            setSelectedId(id)
            seek(at)
            setPicked(true)
          }}
        />
      }
      right={
        <aside aria-label="이 날의 사건" className="side-panel on-wide plate plate-grain">
          {/* 날짜가 들어가는 머리줄은 각인 자간을 줄인다 — 0.3em 으로 벌리면 숫자가 뜨갈라붙어 날짜로 읽히지 않는다 */}
          <h2 className="flex shrink-0 items-center gap-3 border-b border-white/4 px-5 py-4 type-eng tracking-[0.08em] text-muted">
            {monthDay(new Date(dayStart))}의 사건
            <span className="ml-auto tabular-nums text-ink">{dayEvents.length}건</span>
          </h2>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {dayEvents.length === 0 && <li className="px-5 py-4 type-caption text-muted">이 카메라에 이 날 사건이 없습니다.</li>}
            {dayEvents.map((e) => {
              const level = severityOf(e.kind)
              const pending = e.status === 'OPEN'
              return (
                <li key={e.id}>
                  {/* 경보 칸과 같은 꼴이다 — 등과 바탕이 단계를, 글자는 손을 기다리는지를 말한다 */}
                  <button
                    type="button"
                    onClick={() => seek(Date.parse(e.detectedAt) - 10_000)}
                    className={`grid w-full grid-cols-[auto_auto_1fr] items-center gap-3 px-5 py-3 text-left transition-colors ${
                      pending ? SEVERITY_ROW[level] : 'hover:bg-white/3'
                    }`}
                  >
                    <StatusDot state={pending ? level : 'idle'} />
                    <span className="type-caption text-muted tabular-nums">{fmtTime(new Date(e.detectedAt))}</span>
                    <span className={`truncate type-body ${pending ? `font-semibold ${SEVERITY_TEXT[level]}` : 'text-muted'}`}>
                      {SEVERITY_LABEL[level]} · {eventLabel(e.kind)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
      }
    >
      <div className="plate plate-grain flex min-h-0 flex-1 flex-col gap-3 p-4 max-md:gap-2 max-md:p-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {/* 폴더가 자리를 내준 폭이라 돌아갈 길을 여기 둔다 */}
          <Button variant="ghost" className="on-narrow" onClick={() => setPicked(false)}>
            <Icon name="chevronLeft" /> 목록
          </Button>
          <h2 className="type-title">{camera.location}</h2>
          <span className="type-caption text-muted max-md:hidden">{camera.streamKey}</span>
          <span className="ml-auto type-title tabular-nums">{fmtDateTime(new Date(playhead))}</span>
        </div>

        <div className="sunk min-h-0 flex-1 overflow-hidden">{screen}</div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="quiet" icon aria-label="10초 뒤로" onClick={() => seek(Math.max(dayStart, playhead - 10_000))}>
              <Icon name="back10" size={18} />
            </Button>
            <Button
              variant="primary"
              icon
              className="min-w-14"
              disabled={!current}
              aria-label={playing ? '일시 정지' : '재생'}
              onClick={() => setPlaying(!playing)}
            >
              <Icon name={playing ? 'pause' : 'play'} size={18} />
            </Button>
            <Button variant="quiet" icon aria-label="10초 앞으로" onClick={() => seek(playhead + 10_000)}>
              <Icon name="fwd10" size={18} />
            </Button>
            {/* 단추 바로 옆이다. 눈이 재생을 보고 있을 때 같은 자리에서 읽힌다 */}
            <span className="ml-2 type-body tabular-nums text-muted">
              <span className="text-ink">{mmss(atSec)}</span> / {mmss(totalSec)}
            </span>
          </div>

          <Segmented
            className="ml-auto"
            label="재생 속도"
            value={rate}
            onChange={setRate}
            options={[
              { value: 1, label: '1×' },
              { value: 2, label: '2×' },
              { value: 4, label: '4×' },
            ]}
          />
        </div>

        <HourTimeline
          hourStart={hourStart}
          segments={segments}
          events={dayEvents}
          windowStart={srcStart}
          windowMs={windowMs}
          onSeek={seek}
        />
      </div>
    </WorkspaceTemplate>
  )
}

function Notice({ children, tone }: { children: React.ReactNode; tone?: 'warn' }) {
  return (
    <div className="grid h-full place-items-center p-4 text-center">
      <div className={`grid justify-items-center gap-2 ${tone === 'warn' ? 'text-warn' : 'text-muted'}`}>
        <Icon name="film" size={28} />
        {children}
      </div>
    </div>
  )
}
