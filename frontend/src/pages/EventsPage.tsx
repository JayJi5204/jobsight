import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { eventLabel, SEVERITY_LABEL, SEVERITY_ORDER, SEVERITY_ROW, SEVERITY_TEXT, severityOf } from '@/constants/events'
import { Button } from '@/components/atoms/Button'
import { DayDivider } from '@/components/atoms/DayDivider'
import { Icon } from '@/components/atoms/Icon'
import { Panel } from '@/components/atoms/Panel'
import { StatusDot } from '@/components/atoms/StatusDot'
import { CameraCounters } from '@/components/molecules/CameraCounters'
import { EmptyState } from '@/components/molecules/EmptyState'
import { EventFilterBar, type EventFilter } from '@/components/molecules/EventFilterBar'
import { EventDetail } from '@/components/organisms/EventDetail'
import { EventDistribution } from '@/components/organisms/EventDistribution'
import { WorkspaceTemplate } from '@/components/templates/WorkspaceTemplate'
import { ROUTES } from '@/constants/routes'
import { zoneOfCode } from '@/constants/zones'
import { useCameras } from '@/hooks/useCameras'
import { useZones } from '@/hooks/useZones'
import { ackEvent, useEvents } from '@/store/events'
import type { ViewCamera } from '@/types/camera'
import type { DetectionEvent, Severity } from '@/types/event'
import { DAY_END_HOUR, dayText, daysAgoText, endOfDayText, hoursInRange, startOfDayText } from '@/utils/distribution'
import { dayKeyOf, fmtHM, fmtTime } from '@/utils/time'

/** 분포에서 짚고 들어온 자리. 둘 다 null 이면 거른 범위 전체 목록이다 */
interface Picked {
  cameraId: number | null
  hour: number | null
}

/** 2026.11.05 */
const dotDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`

/** 어느 구역인가. 아직 어느 구역에도 넣지 않은 카메라는 '—' */
const zoneOf = (camera?: ViewCamera) => (camera ? (zoneOfCode(camera.zone)?.name ?? '—') : '—')

/**
 * 기본 기간은 일주일이다.
 *
 * 한 달을 펴 두면 지난 달 사건까지 더해 칠해져서 방금 난 일이 그 안에 묻힌다.
 * 반대로 오늘 하루만 두면 격자가 거의 비어 "어느 카메라 · 어느 시간에 몰리나" 를 읽을 수 없다.
 */
const INITIAL: EventFilter = {
  from: daysAgoText(7),
  to: dayText(new Date()),
  hourFrom: 0,
  hourTo: DAY_END_HOUR,
  kind: 'all',
  severity: 'all',
  zoneId: 'all',
  slotKey: 'all',
  status: 'all',
}

/**
 * 사건.
 *
 * 왼쪽 기둥은 실시간 화면과 같다 — 어느 화면에 있든 카메라 상태와 목록이 같은 자리에 있어야
 * 눈이 그 자리를 찾는다. 가운데는 분포와 목록이 자리를 번갈아 쓰고, 오른쪽은 늘 차 있다.
 */
export function EventsPage() {
  const events = useEvents()
  const { cameras } = useCameras()
  const rows = useZones()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<EventFilter>(INITIAL)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [marked, setMarked] = useState<Set<number>>(new Set())

  const isList = picked !== null
  const hours = useMemo(() => hoursInRange(filter.hourFrom, filter.hourTo), [filter.hourFrom, filter.hourTo])

  /** 카메라 번호로 그 카메라가 앉은 자리를 찾는다. 구역·카메라 거르개가 이걸로 걸러진다 */
  const seatOf = useMemo(
    () =>
      new Map(
        rows.flatMap((r) =>
          r.slots
            .filter((s) => s.cameraId !== null)
            .map((s) => [s.cameraId as number, { zoneId: r.zone.id, key: s.key }] as const),
        ),
      ),
    [rows],
  )

  /**
   * 경보 칸에서 줄을 누르고 들어온 자리(`?event=`). 그 사건의 상세를 바로 연다.
   *
   * 거르개가 그 사건을 걸러 내고 있으면 상세가 빈 채로 뜨므로, 들어온 사건이
   * 들어오도록 날짜와 시간대를 먼저 넓힌다 — 눌렀는데 아무것도 없는 것이 가장 나쁘다.
   */
  /**
   * 윗줄 계수기에서 단계를 눌러 들어온 자리(`?severity=`).
   *
   * 계수기가 세는 것과 **같은 것**을 보여 준다 — 아직 확인 안 한, 그 단계. 범위를 넓게
   * 두면 2 를 눌렀는데 목록에 5 건이 서서 어느 숫자가 맞는지 알 수 없다.
   * 분포가 아니라 목록으로 연다 — 숫자를 눌렀으면 그 숫자만큼의 줄을 보고 싶은 것이다.
   *
   * 기간은 **처리가 남은 사건이 걸쳐 있는 날들**로 맞춘다. 오늘 하루로 묶던 때는 어제
   * 난 미확인이 숫자에는 들고 목록에는 안 들었다. 반대로 끝을 늘 오늘로 두면, 며칠째
   * 조용할 때 아무것도 없는 날들이 분포 격자의 폭을 그대로 먹는다.
   *
   * 사건이 아직 안 왔으면 아무것도 하지 않는다. 그 사이에 주소만 비우면 사건이 온 뒤에
   * 다시 맞출 기회가 없어, 누른 단계가 아닌 화면이 선다.
   */
  const wantedLevel = params.get('severity')
  useEffect(() => {
    if (wantedLevel === null) return
    if (!SEVERITY_ORDER.includes(wantedLevel as Severity)) return
    if (events.length === 0) return
    // 누른 단계만 본다. 미확인 전부로 재면 오늘 난 주의 한 건이 경고의 끝 날을 오늘까지 끌어당긴다
    const open = events.filter((e) => e.status === 'OPEN' && severityOf(e.kind) === wantedLevel)
    const days = open.map((e) => dayText(new Date(e.detectedAt))).sort()
    const today = dayText(new Date())
    setFilter({
      ...INITIAL,
      from: days[0] ?? today,
      to: days[days.length - 1] ?? today,
      severity: wantedLevel as Severity,
      status: 'open',
    })
    setPicked({ cameraId: null, hour: null })
    setSelectedId(null)
    setParams({}, { replace: true })
  }, [wantedLevel, events, setParams])

  // 주소로 오는 값은 늘 글자다. 사건 번호는 숫자라 견주기 전에 바꾼다
  const wanted = Number(params.get('event')) || null
  useEffect(() => {
    if (wanted === null) return
    const hit = events.find((e) => e.id === wanted)
    if (hit === undefined) return
    const at = new Date(hit.detectedAt)
    const day = dayText(at)
    setFilter((f) => ({
      ...f,
      from: day < f.from ? day : f.from,
      to: day > f.to ? day : f.to,
      hourFrom: 0,
      hourTo: DAY_END_HOUR,
      kind: 'all',
      severity: 'all',
      zoneId: seatOf.get(hit.cameraId)?.zoneId ?? 'all',
      slotKey: seatOf.get(hit.cameraId)?.key ?? 'all',
    }))
    setPicked({ cameraId: hit.cameraId, hour: at.getHours() })
    setSelectedId(hit.id)
    // 주소는 한 번 쓰고 비운다. 남겨 두면 목록으로 돌아가도 이 사건이 다시 열린다
    setParams({}, { replace: true })
  }, [wanted, events, seatOf, setParams])

  /** 거르개까지. 분포는 여기까지 보고, 목록은 짚은 자리까지 더 좁힌다 */
  const inRange = useMemo(() => {
    const from = startOfDayText(filter.from)
    const to = endOfDayText(filter.to)
    const shown = new Set(hours)
    return events
      .filter((e) => {
        const t = Date.parse(e.detectedAt)
        return t >= from && t <= to && shown.has(new Date(t).getHours())
      })
      .filter((e) => filter.kind === 'all' || e.kind === filter.kind)
      .filter((e) => filter.severity === 'all' || severityOf(e.kind) === filter.severity)
      .filter((e) => {
        if (filter.zoneId === 'all' && filter.slotKey === 'all') return true
        // 어느 자리에도 안 앉은 카메라는 구역으로 좁히는 순간 빠진다 — 그 구역 것이 아니다
        const seat = seatOf.get(e.cameraId)
        if (seat === undefined) return false
        if (filter.zoneId !== 'all' && seat.zoneId !== filter.zoneId) return false
        return filter.slotKey === 'all' || seat.key === filter.slotKey
      })
      .filter((e) => filter.status === 'all' || (filter.status === 'open') === (e.status === 'OPEN'))
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
  }, [events, filter, hours, seatOf])

  const visible = useMemo(() => {
    if (picked === null) return inRange
    return inRange
      .filter((e) => picked.cameraId === null || e.cameraId === picked.cameraId)
      .filter((e) => picked.hour === null || new Date(e.detectedAt).getHours() === picked.hour)
  }, [inRange, picked])

  /**
   * 짚은 줄과 세워 둘 상세는 다르다.
   *
   * 목록에 들어온 뒤로 상세 칸은 늘 차 있다 — 짚은 것이 없으면 맨 윗줄을 연다.
   * 목록 옆에 경보 칸을 세워 두면 방금 고른 사건을 보려고 또 어딘가를 눌러야 하고,
   * 빈 칸을 두면 그 자리가 무엇을 하는 자리인지 알 수 없다.
   *
   * 다만 **표를 덮는 꼴은 짚었을 때만**이다(`pickedEvent`). 맨 윗줄이 저절로 열린 것을
   * 가지고 좁은 폭에서 표를 치우면, 목록에 들어왔는데 목록이 없다.
   */
  const pickedEvent = selectedId === null ? null : (visible.find((e) => e.id === selectedId) ?? null)
  const selected = isList ? (pickedEvent ?? visible[0] ?? null) : null
  const cameraOf = (id: number) => cameras.find((c) => c.id === id)
  const label = (id: number) => cameraOf(id)?.location ?? `카메라 ${id}`
  const pendingMarked = [...marked].filter((id) => visible.some((e) => e.id === id && e.status === 'OPEN'))

  if (events.length === 0) {
    return (
      <EmptyState icon="bell" title="아직 사건이 없습니다">
        <p>탐지 기능이 연결되면 카메라가 감지한 사건이 여기에 쌓이고, 누가 언제 확인했는지 관리할 수 있습니다.</p>
      </EmptyState>
    )
  }

  const backToGrid = () => {
    setPicked(null)
    setSelectedId(null)
    setMarked(new Set())
  }

  const toggleMark = (id: number) =>
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <WorkspaceTemplate
      aside={<CameraCounters />}
      /* 오른쪽 칸이 기둥이 설 때만 서는 화면이다(rail-wide) — 누우면 그 자리를
         작업면이 가져간다. 안 그러면 분포 아래가 통째로 빈 바닥으로 남는다 */
      className={`rail-wide ${pickedEvent !== null ? 'detail-open' : ''}`}
      right={
        /* 목록을 보는 동안에는 상세가, 분포를 보는 동안에는 경보가 선다.
           목록과 경보를 같이 세우면 고른 줄이 어디에서 펴지는지가 없다 */
        isList ? (
          <aside
            className="side-panel is-detail plate plate-grain flex min-h-0 flex-col overflow-hidden"
            aria-label="사건 상세"
          >
            {selected === null ? (
              <p className="grid flex-1 place-items-center px-6 text-center type-caption text-muted">
                조건에 맞는 사건이 없습니다.
              </p>
            ) : (
              <EventDetail
                event={selected}
                cameraLabel={label(selected.cameraId)}
                streamKey={cameraOf(selected.cameraId)?.streamKey ?? ''}
                zone={zoneOf(cameraOf(selected.cameraId))}
                onBack={() => setSelectedId(null)}
                onAck={() => ackEvent(selected.id)}
                onRecording={() =>
                  navigate(
                    `${ROUTES.RECORDINGS}?camera=${selected.cameraId}&t=${encodeURIComponent(selected.detectedAt)}`,
                  )
                }
              />
            )}
          </aside>
        ) : (
          <Pending
            events={events}
            label={label}
            onOpen={(e) => {
              setPicked({ cameraId: e.cameraId, hour: new Date(e.detectedAt).getHours() })
              setSelectedId(e.id)
            }}
          />
        )
      }
    >
      <section
        className="plate plate-grain plate-screws flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/5 px-4 py-3">
          <h2 className="type-eng text-muted">사건</h2>
          <span className="flex-1" />
          <span className="type-caption text-muted tabular-nums">
            {(isList ? visible.length : inRange.length).toLocaleString()}건
          </span>
          {/* 오가는 단추는 한자리에 있어야 눈이 그 자리를 찾는다 */}
          {isList ? (
            <Button variant="ghost" onClick={backToGrid}>
              돌아가기
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setPicked({ cameraId: null, hour: null })}>
              목록 보기
            </Button>
          )}
        </div>

        <EventFilterBar value={filter} onChange={setFilter} hasCamera={isList} />

        {pendingMarked.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-white/3 px-4 py-3">
            <span className="type-body text-ink tabular-nums">{pendingMarked.length}건 고름</span>
            <Button variant="ghost" className="ml-auto" onClick={() => setMarked(new Set())}>
              무르기
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                pendingMarked.forEach(ackEvent)
                setMarked(new Set())
              }}
            >
              <Icon name="check" /> 확인 처리
            </Button>
          </div>
        )}

        {!isList ? (
          <EventDistribution
            events={inRange}
            cameras={cameras}
            hours={hours}
            nowHour={new Date().getHours()}
            onPick={(id, hour) => {
              setPicked({ cameraId: id, hour })
              setSelectedId(null)
            }}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            bare
            icon="bell"
            title="조건에 맞는 사건이 없습니다"
            action={
              <Button variant="ghost" onClick={backToGrid}>
                돌아가기
              </Button>
            }
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full type-body text-center">
              <thead className="sticky top-0 bg-panel">
                <tr className="border-b border-line type-eng font-normal text-muted">
                  <th className="w-10 py-3.5 pl-4.5" />
                  <th className="truncate px-4.5 py-3.5">지역</th>
                  <th className="truncate px-4.5 py-3.5">카메라</th>
                  <th className="truncate px-4.5 py-3.5">경보</th>
                  <th className="truncate px-4.5 py-3.5">카테고리</th>
                  <th className="truncate px-4.5 py-3.5">발생 일자</th>
                  <th className="truncate px-4.5 py-3.5">발생 시각</th>
                  <th className="truncate px-4.5 py-3.5 pr-4.5">확인 상태</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => {
                  const at = new Date(e.detectedAt)
                  const level = severityOf(e.kind)
                  const pending = e.status === 'OPEN'
                  const active = e.id === selectedId
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className={`cursor-pointer border-b border-white/4 transition-colors ${
                        active ? 'bg-accent/15' : 'hover:bg-white/4'
                      }`}
                    >
                      <td className="py-3 pl-4.5">
                        <input
                          type="checkbox"
                          aria-label={`${label(e.cameraId)} ${fmtTime(at)} 고르기`}
                          className="size-4 accent-accent"
                          disabled={!pending}
                          checked={marked.has(e.id)}
                          onClick={(ev) => ev.stopPropagation()}
                          onChange={() => toggleMark(e.id)}
                        />
                      </td>
                      <td className="px-4.5 py-3 whitespace-nowrap text-muted">{zoneOf(cameraOf(e.cameraId))}</td>
                      <td className="px-4.5 py-3 whitespace-nowrap">{label(e.cameraId)}</td>
                      <td className={`px-4.5 py-3 whitespace-nowrap font-semibold ${pending ? SEVERITY_TEXT[level] : 'text-muted'}`}>
                        {SEVERITY_LABEL[level]}
                      </td>
                      <td className="px-4.5 py-3 whitespace-nowrap">{eventLabel(e.kind)}</td>
                      <td className="px-4.5 py-3 whitespace-nowrap text-muted tabular-nums">{dotDate(at)}</td>
                      <td className="px-4.5 py-3 whitespace-nowrap tabular-nums">{fmtTime(at)}</td>
                      <td className="px-4.5 py-3 whitespace-nowrap pr-4.5">
                        {/* 초록은 끝난 것에만 쓴다 — 손이 더 갈 데가 없다는 뜻이다 */}
                        <span className={`font-semibold ${pending ? 'text-warn' : 'text-ok'}`}>
                          {pending ? '미확인' : '확인함'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </WorkspaceTemplate>
  )
}

/**
 * 확인이 남은 경보. 분포를 들여다보는 동안에도 지금 울린 것을 놓치지 않을 자리다.
 * 다른 화면의 경보 칸과 **같은 판·같은 머리줄**을 쓴다 — 틀을 따로 짜 두었더니
 * 머리줄 여백과 건수 글자가 저 혼자 달라졌다.
 */
function Pending({
  events,
  label,
  onOpen,
}: {
  events: DetectionEvent[]
  label: (id: number) => string
  onOpen: (e: DetectionEvent) => void
}) {
  const open = events.filter((e) => e.status === 'OPEN').sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
  return (
    <Panel
      title="경보"
      action={
        <span className={`type-caption font-semibold tabular-nums ${open.length > 0 ? 'text-warn' : 'text-muted'}`}>
          미확인 {open.length}건
        </span>
      }
      /* 기둥이 서는 폭에만 선다(.on-wide). 누우면 분포 아래에 쌓여 세로를 가져가는데,
         좁은 화면에서 분포는 그만큼 칸이 납작해진다. 지금 울린 것은 윗줄 계수기가
         이미 말하고 있고, 누를 줄은 목록에 있다 */
      className="side-panel on-wide"
    >
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {open.length === 0 && <li className="px-2 py-4 type-caption text-muted">확인이 남은 경보가 없습니다.</li>}
        {open.map((e, i) => {
          const level = severityOf(e.kind)
          const at = new Date(e.detectedAt)
          // 날이 바뀌는 자리에만 날짜를 세운다
          const newDay = i === 0 || dayKeyOf(e.detectedAt) !== dayKeyOf(open[i - 1].detectedAt)
          return (
            <Fragment key={e.id}>
              {newDay && (
                <li>
                  <DayDivider at={e.detectedAt} />
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => onOpen(e)}
                  className={`grid w-full grid-cols-[auto_auto_1fr] items-start gap-3 px-5 py-3.5 text-left transition-colors ${SEVERITY_ROW[level]}`}
                >
                  <StatusDot state={level} className="mt-1" />
                  <span className="mt-0.5 type-caption text-muted tabular-nums">{fmtHM(at)}</span>
                  <span className="min-w-0">
                    <span className={`block truncate type-body font-semibold ${SEVERITY_TEXT[level]}`}>
                      {SEVERITY_LABEL[level]} · {eventLabel(e.kind)}
                    </span>
                    <span className="mt-1.5 block truncate type-caption text-[#5c656c]">{label(e.cameraId)}</span>
                  </span>
                </button>
              </li>
            </Fragment>
          )
        })}
      </ul>
    </Panel>
  )
}
