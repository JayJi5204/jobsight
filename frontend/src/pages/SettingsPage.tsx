import { useEffect, useState, type ReactNode } from 'react'
import { StatusDot } from '@/components/atoms/StatusDot'
import { CameraCounters } from '@/components/molecules/CameraCounters'
import { EmptyState } from '@/components/molecules/EmptyState'
import { PlateTabs } from '@/components/molecules/PlateTabs'
import { EventRail } from '@/components/organisms/layout/EventRail'
import { WorkspaceTemplate } from '@/components/templates/WorkspaceTemplate'
import { fetchSystem } from '@/api/system'
import type { SystemInfo } from '@/types/system'

const TABS = [
  { value: 'storage', label: '저장소' },
  { value: 'server', label: '서버' },
] as const

type Tab = (typeof TABS)[number]['value']

const REFRESH_MS = 30_000
const WARN_PCT = 75
const DANGER_PCT = 90

/** 612 GB · 11.4 GB. 두 자리 아래는 읽을 것이 없다 */
const gb = (n: number) => `${n >= 100 ? Math.round(n) : n.toFixed(1)} GB`

/** 5일 7시간 */
const uptime = (s: number) => {
  const d = Math.floor(s / 86_400)
  const h = Math.floor((s % 86_400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return d > 0 ? `${d}일 ${h}시간` : h > 0 ? `${h}시간 ${m}분` : `${m}분`
}

/** 2일 23시간. 보존 일수와 나란히 놓고 견주려면 같은 단위여야 한다 */
const spanInDays = (hours: number) => {
  const d = Math.floor(hours / 24)
  const h = Math.round(hours % 24)
  if (d === 0) return `${h}시간`
  return h === 0 ? `${d}일` : `${d}일 ${h}시간`
}

/**
 * 설정. 지금은 읽기만 한다 — 저장소가 얼마나 찼고 서버가 어떤 상태인지.
 *
 * 고칠 수 있는 값은 아직 없다. 녹화 경로와 보존 기간은 서버 설정이 쥐고 있고,
 * 화면에서 바꿀 수 있는 것처럼 보이면 바꿨다고 착각하게 된다. 그래서 값은 입력칸이
 * 아니라 판에 파인 홈에 앉아 있다 — 홈에 앉은 것은 손대는 것이 아니다.
 *
 * 양쪽 기둥은 다른 화면과 같이 선다 — 장비를 손보는 중에도 경보는 놓치면 안 된다.
 * 카메라 목록이나 경보 줄을 누르면 그 카메라의 실시간으로 간다.
 */
export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('storage')
  const [system, setSystem] = useState<SystemInfo | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    const load = () => {
      fetchSystem(ac.signal)
        .then((s) => {
          setSystem(s)
          setFailed(false)
        })
        .catch(() => {
          if (!ac.signal.aborted) setFailed(true)
        })
    }
    load()
    const id = window.setInterval(load, REFRESH_MS)
    return () => {
      ac.abort()
      window.clearInterval(id)
    }
  }, [])

  return (
    <WorkspaceTemplate
      aside={<CameraCounters />}
      right={<EventRail />}
    >
      <main className="plate plate-grain plate-screws flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PlateTabs tabs={TABS} value={tab} onChange={setTab} label="설정 구역" />

        {system === null ? (
          <EmptyState bare icon={failed ? 'alert' : 'camera'} title={failed ? '장비 상태를 불러오지 못했습니다' : '불러오는 중…'}>
            {failed && <p>운영 서버가 떠 있는지 확인하세요.</p>}
          </EmptyState>
        ) : (
          /* 좁은 화면에서 28px 씩 양쪽을 비우면 값 상자에 남는 폭이 그만큼 준다 */
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 lg:gap-7 lg:px-7 lg:py-6">
            {tab === 'storage' ? <Storage system={system} /> : <Server system={system} />}
          </div>
        )}
      </main>
    </WorkspaceTemplate>
  )
}

function Storage({ system }: { system: SystemInfo }) {
  const pct = system.storage.usagePct
  const level = pct >= DANGER_PCT ? 'danger' : pct >= WARN_PCT ? 'warning' : 'live'
  const bar = pct >= DANGER_PCT ? 'bg-crit-ink' : pct >= WARN_PCT ? 'bg-warn' : 'bg-ok/70'

  return (
    <Group title="저장소">
      <Row label="사용량">
        <div className="flex items-center gap-4">
          <div className="sunk h-3 flex-1 overflow-hidden">
            <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="type-title tabular-nums text-ink">{pct}%</span>
          {/* 등은 줄 끝이 아니라 제가 말하는 숫자 바로 옆에 붙인다 */}
          <span className="flex items-center gap-2 type-caption whitespace-nowrap text-muted tabular-nums">
            {gb(system.storage.usedGB)} / {gb(system.storage.totalGB)}
            <StatusDot state={level} />
          </span>
        </div>
      </Row>
      <Row label="녹화 경로">
        <ReadOnly>{system.recording.dir}</ReadOnly>
      </Row>
      <Row label="녹화 파일">
        <ReadOnly>{system.recording.files.toLocaleString()}</ReadOnly>
      </Row>
      <Row label="녹화 점유">
        <ReadOnly>{gb(system.recording.sizeGB)}</ReadOnly>
      </Row>
      {/* 보존 기간은 실보관 기간 바로 아래 둔다. "3일 두기로 했는데 하루치뿐" 을 알아채려면
          정한 값과 실제 값이 같은 눈높이에, 같은 단위로 있어야 한다 */}
      <Row label="실보관 기간">
        <ReadOnly>{system.recording.spanHours !== null ? spanInDays(system.recording.spanHours) : '—'}</ReadOnly>
      </Row>
      <Row label="녹화 보존">
        <ReadOnly>{system.retention ? `${system.retention.recordDays}일` : '—'}</ReadOnly>
      </Row>
      <Row label="사건 보존">
        <ReadOnly>{system.retention ? `${system.retention.eventDays}일` : '—'}</ReadOnly>
      </Row>
    </Group>
  )
}

function Server({ system }: { system: SystemInfo }) {
  const { host, channels } = system
  return (
    <Group title="서버">
      <Row label="호스트">
        <ReadOnly>{host.hostname}</ReadOnly>
      </Row>
      <Row label="운영체제">
        <ReadOnly>{host.os}</ReadOnly>
      </Row>
      <Row label="CPU">
        <ReadOnly>
          {host.cpu.model} · {host.cpu.cores}코어
        </ReadOnly>
      </Row>
      <Row label="CPU 사용률">
        <ReadOnly>{host.cpu.usagePct}%</ReadOnly>
      </Row>
      <Row label="메모리">
        <ReadOnly>
          {gb(host.memory.usedGB)} / {gb(host.memory.totalGB)} ({host.memory.usagePct}%)
        </ReadOnly>
      </Row>
      <Row label="가동 시간">
        <ReadOnly>{uptime(host.uptimeS)}</ReadOnly>
      </Row>
      <Row label="카메라 채널">
        <ReadOnly>
          {channels.watching} / {channels.total} 감시 중
        </ReadOnly>
      </Row>
    </Group>
  )
}

/** 구역 하나. 머리줄에 이름이 선다 */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="border-b border-line pb-3">
        <h3 className="type-title text-ink">{title}</h3>
      </div>
      {children}
    </section>
  )
}

/** 값 한 줄. 왼쪽은 이름, 가운데는 값, 오른쪽은 등 */
function Row({ label, children, aside }: { label: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid items-center gap-2 border-b border-white/4 py-4 md:grid-cols-[16.25rem_1fr_auto] md:gap-5">
      <p className="type-body text-ink">{label}</p>
      {/* 좁은 화면에서는 이름이 윗줄, 값과 등이 아랫줄 한 줄에 선다.
          md:contents 로 이 묶음을 넓은 화면에서는 없애 격자 둘째·셋째 칸이 제자리에 놓이게 한다 */}
      <div className="flex min-w-0 items-center gap-2.5 md:contents">
        <div className="min-w-0 max-w-105 flex-1">{children}</div>
        {aside !== undefined && <div className="flex shrink-0 items-center gap-2.5">{aside}</div>}
      </div>
    </div>
  )
}

/** 바꿀 수 없는 값. 홈에 파인 채 앉아 있다 */
function ReadOnly({ children }: { children: ReactNode }) {
  return (
    <p className="sunk flex h-10 items-center overflow-hidden px-3.5 type-body text-muted tabular-nums">
      <span className="truncate">{children}</span>
    </p>
  )
}
