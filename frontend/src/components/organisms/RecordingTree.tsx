import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Panel } from '@/components/atoms/Panel'
import { fetchRecordingSegments } from '@/api/recordings'
import { useZones, type SlotView } from '@/hooks/useZones'
import type { RecordingSegment } from '@/types/recording'
import { hoursOf } from '@/utils/recordingTree'
import { DAY_MS, fmtHM, startOfDay } from '@/utils/time'

/** 트리에 세울 날 수. 더 옛날은 보관 기간 밖이라 열어도 비어 있다 */
const DAYS = 10

/** 한 단 들어갈 때마다 밀어 넣는 폭 */
const INDENT_PX = 14

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; segments: RecordingSegment[] }

interface Props {
  /** 지금 보고 있는 카메라와 시각 — 그 자리까지 폴더를 펼쳐 둔다 */
  cameraId: number
  playhead: number
  onPick: (cameraId: number, atMs: number) => void
  className?: string
}

const dayKey = (day: number) => `d${day}`
const zoneKey = (day: number, zoneId: number) => `d${day}|z${zoneId}`
const camKey = (day: number, zoneId: number, slot: string) => `d${day}|z${zoneId}|${slot}`
const hourKey = (day: number, zoneId: number, slot: string, hour: number) => `d${day}|z${zoneId}|${slot}|h${hour}`

/** 2026-11-11 */
const dayLabel = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * 녹화 폴더. 날짜 → 구역 → 카메라 → 시 → 구간.
 *
 * 디스크에 쌓인 순서 그대로가 아니라 되돌려 볼 때 짚는 순서로 접는다.
 * **어느 단계든 최신이 위다** — 방금 일을 보려고 여는 일이 가장 잦다.
 *
 * 구역이 한 단 들어온 것은 카메라가 오백 대이기 때문이다. 날짜 밑에 오백 줄을
 * 늘어놓으면 찾는 카메라가 어느 줄인지 셀 수가 없다. 구역을 거치면 스물다섯 줄에서
 * 스무 줄로 두 번만 좁히면 된다.
 *
 * 구간은 카메라 폴더를 열 때 그 카메라·그 날짜만 받아 온다. 한꺼번에 받지 않는다.
 * 실물이 없는 자리는 받을 것도 없어서 묻지 않고 바로 비었다고 한다.
 *
 * 단마다 같은 폭으로 밀고 접힘쇠·폴더를 같은 자리에 둔다. 날이 쌓여도 줄의
 * 생김새는 그대로라, 어느 단에 있는지가 들여쓰기만으로 읽힌다.
 */
export function RecordingTree({ cameraId, playhead, onPick, className = '' }: Props) {
  const rows = useZones()
  const today = startOfDay(new Date()).getTime()
  const days = Array.from({ length: DAYS }, (_, i) => today - i * DAY_MS)

  const openDay = startOfDay(new Date(playhead)).getTime()
  const openHour = new Date(playhead).getHours()
  // 지금 보고 있는 카메라가 어느 구역의 어느 자리인가
  const here = rows
    .flatMap((r) => r.slots.map((s) => ({ zoneId: r.zone.id, slot: s })))
    .find((x) => x.slot.cameraId === cameraId)

  // 지금 보고 있는 자리까지는 열어 둔다. 어디에 있는지 모른 채 폴더만 보이면 길을 잃는다
  const [open, setOpen] = useState<Set<string>>(() => {
    const keys = [dayKey(openDay)]
    if (here) {
      keys.push(
        zoneKey(openDay, here.zoneId),
        camKey(openDay, here.zoneId, here.slot.key),
        hourKey(openDay, here.zoneId, here.slot.key, openHour),
      )
    }
    return new Set(keys)
  })
  const [loads, setLoads] = useState<Record<string, Load>>({})

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  // 펼쳐진 카메라 폴더의 구간만 받는다 (키가 세 토막인 것이 카메라 단이다)
  useEffect(() => {
    const wanted = [...open].filter((k) => k.split('|').length === 3 && loads[k] === undefined)
    if (wanted.length === 0) return
    const ac = new AbortController()
    for (const key of wanted) {
      const [d, , slotKey] = key.split('|')
      const day = Number(d.slice(1))
      const slot = rows.flatMap((r) => r.slots).find((s) => s.key === slotKey)
      if (slot?.cameraId == null) {
        setLoads((prev) => ({ ...prev, [key]: { status: 'ready', segments: [] } }))
        continue
      }
      const id = slot.cameraId
      setLoads((prev) => ({ ...prev, [key]: { status: 'loading' } }))
      fetchRecordingSegments(id, new Date(day), ac.signal)
        .then((segments) => setLoads((prev) => ({ ...prev, [key]: { status: 'ready', segments } })))
        .catch(() => {
          if (!ac.signal.aborted) setLoads((prev) => ({ ...prev, [key]: { status: 'error' } }))
        })
    }
    return () => ac.abort()
  }, [open, loads, rows])

  return (
    <Panel title="녹화" className={className}>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 type-body select-none">
        {days.map((day) => {
          const dKey = dayKey(day)
          const dayOpen = open.has(dKey)
          return (
            <div key={dKey}>
              <FolderRow depth={0} open={dayOpen} current={day === openDay} onClick={() => toggle(dKey)}>
                {dayLabel(new Date(day))}
              </FolderRow>

              {dayOpen &&
                rows.map(({ zone, slots }) => {
                  const zKey = zoneKey(day, zone.id)
                  const zoneOpen = open.has(zKey)
                  return (
                    <div key={zKey}>
                      <FolderRow
                        depth={1}
                        open={zoneOpen}
                        current={day === openDay && zone.id === here?.zoneId}
                        onClick={() => toggle(zKey)}
                      >
                        {zone.name}
                      </FolderRow>

                      {zoneOpen &&
                        slots.map((slot) => (
                          <CameraFolder
                            key={slot.key}
                            day={day}
                            zoneId={zone.id}
                            slot={slot}
                            load={loads[camKey(day, zone.id, slot.key)]}
                            open={open}
                            toggle={toggle}
                            isHere={day === openDay && slot.cameraId === cameraId}
                            openHour={openHour}
                            playhead={playhead}
                            onPick={onPick}
                          />
                        ))}
                    </div>
                  )
                })}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

/** 카메라 한 자리와 그 아래 시·구간 */
function CameraFolder({
  day,
  zoneId,
  slot,
  load,
  open,
  toggle,
  isHere,
  openHour,
  playhead,
  onPick,
}: {
  day: number
  zoneId: number
  slot: SlotView
  load: Load | undefined
  open: Set<string>
  toggle: (key: string) => void
  isHere: boolean
  openHour: number
  playhead: number
  onPick: (cameraId: number, atMs: number) => void
}) {
  const cKey = camKey(day, zoneId, slot.key)
  const camOpen = open.has(cKey)

  return (
    <div>
      <FolderRow depth={2} open={camOpen} current={isHere} onClick={() => toggle(cKey)}>
        {slot.label}
      </FolderRow>

      {/* 아직 묻는 중인지, 물어봤는데 없는지를 가른다. 고리가 없으면 '녹화 없음' 과
          구별이 안 돼서, 기다리면 될 자리에서 녹화가 끊긴 줄 안다 */}
      {camOpen && (load === undefined || load.status === 'loading') && (
        <Leaf depth={3}>
          <span className="inline-flex items-center gap-2">
            받는 중
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-line border-t-muted" />
          </span>
        </Leaf>
      )}
      {camOpen && load?.status === 'error' && (
        <Leaf depth={3} tone="warn">
          목록을 받지 못했습니다
        </Leaf>
      )}
      {camOpen && load?.status === 'ready' && load.segments.length === 0 && <Leaf depth={3}>녹화 없음</Leaf>}
      {camOpen &&
        load?.status === 'ready' &&
        hoursOf(load.segments, day)
          .slice()
          .reverse()
          .map((node) => {
            const hKey = hourKey(day, zoneId, slot.key, node.hour)
            const hourOpen = open.has(hKey)
            return (
              <div key={hKey}>
                <FolderRow
                  depth={3}
                  open={hourOpen}
                  current={isHere && node.hour === openHour}
                  onClick={() => toggle(hKey)}
                >
                  {String(node.hour).padStart(2, '0')}시
                </FolderRow>

                {hourOpen &&
                  node.spans
                    .slice()
                    .reverse()
                    .map((span) => {
                      const playingHere = playhead >= span.start && playhead < span.end
                      return (
                        <button
                          key={span.start}
                          type="button"
                          onClick={() => slot.cameraId !== null && onPick(slot.cameraId, span.start)}
                          style={{ paddingLeft: 4 * INDENT_PX + 6 }}
                          className={`flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left tabular-nums transition-colors hover:bg-white/5 hover:text-ink ${
                            playingHere ? 'bg-white/6 text-ink' : 'text-muted'
                          }`}
                        >
                          <span className="w-3 shrink-0" />
                          <Icon name="film" size={14} className="shrink-0" />
                          <span className="truncate">
                            {fmtHM(new Date(span.start))} ~ {fmtHM(new Date(span.end))}
                          </span>
                        </button>
                      )
                    })}
              </div>
            )
          })}
    </div>
  )
}

function FolderRow({
  depth,
  open,
  current,
  onClick,
  children,
}: {
  depth: number
  open: boolean
  current?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      style={{ paddingLeft: depth * INDENT_PX + 6 }}
      className={`flex w-full items-center gap-1.5 rounded py-1 pr-2 text-left transition-colors hover:bg-white/5 hover:text-ink ${
        current ? 'bg-white/6 text-ink' : 'text-muted'
      }`}
    >
      <Icon name="chevronRight" size={12} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      <Icon name="folder" size={14} className="shrink-0 text-accent/75" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  )
}

function Leaf({ depth, tone, children }: { depth: number; tone?: 'warn'; children: ReactNode }) {
  return (
    <p
      style={{ paddingLeft: depth * INDENT_PX + 6 + 18 }}
      className={`px-3 py-2 ${tone === 'warn' ? 'text-warn' : 'text-muted'}`}
    >
      {children}
    </p>
  )
}
