import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CameraCounters } from '@/components/molecules/CameraCounters'
import { EmptyState } from '@/components/molecules/EmptyState'
import { LayoutPicker } from '@/components/molecules/LayoutPicker'
import { PagePicker } from '@/components/molecules/PagePicker'
import { ZonePager } from '@/components/molecules/ZonePager'
import { CameraGrid } from '@/components/organisms/CameraGrid'
import { currentZoneId } from '@/components/organisms/ZoneTree'
import { EventRail } from '@/components/organisms/layout/EventRail'
import { WorkspaceTemplate } from '@/components/templates/WorkspaceTemplate'
import { useCameras } from '@/hooks/useCameras'
import { useGridSize } from '@/hooks/useGridSize'
import { useZones } from '@/hooks/useZones'

/** 사건 화면에서 ?focus=카메라id 로 들어오면 그 카메라를 크게 보여 준다 */
function initialFocusCameraId(): number | null {
  const v = Number(new URLSearchParams(window.location.search).get('focus'))
  return Number.isFinite(v) && v > 0 ? v : null
}

export function LiveViewPage() {
  const { status, error } = useCameras()
  const rows = useZones()
  const [grid, setGrid] = useGridSize()
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  /**
   * 영상 벽은 **늘 한 구역**을 본다(?zone=). 고른 게 없으면 첫 구역이다.
   *
   * 오백 자리를 한 줄로 이어 놓으면 쪽 넘기개가 쉰여섯 쪽이 되고, 그 숫자는
   * 지금 어디를 보고 있는지를 알려 주지 않는다. 구역이 단위다.
   *
   * 거르개를 주소에 둔 것은 구역을 누르는 자리가 여럿이기 때문이다 —
   * 지도의 구도, 기둥의 칸도 같은 주소로 보내면 어디서 눌렀든 같은 화면이 선다.
   */
  const zoneId = currentZoneId(useLocation().search)
  const row = rows.find((r) => r.zone.id === zoneId) ?? rows[0] ?? null
  const slots = useMemo(() => row?.slots ?? [], [row])

  // 사건에서 ?focus= 로 들어왔으면 그 카메라가 앉은 자리를 찾아 크게 연다
  useEffect(() => {
    const want = initialFocusCameraId()
    if (want === null) return
    const hit = rows.flatMap((r) => r.slots).find((s) => s.cameraId === want)
    if (hit) setFocusKey(hit.key)
  }, [rows])

  // 구역을 바꾸면 첫 쪽부터. 3쪽을 보던 채로 다른 구역에 들어가면 빈 화면이 선다
  useEffect(() => setPage(0), [row?.zone.id])

  const focused = focusKey !== null && slots.some((s) => s.key === focusKey) ? focusKey : null
  const size = focused !== null ? 1 : grid
  const perPage = size * size
  const pages = Math.max(1, Math.ceil(slots.length / perPage))
  const current = Math.min(page, pages - 1)
  const shown =
    focused !== null ? slots.filter((s) => s.key === focused) : slots.slice(current * perPage, (current + 1) * perPage)

  const toggleFocus = (key: string) => setFocusKey((f) => (f === key ? null : key))

  // 키보드: Esc 는 크게 보기에서 빠져나오기, 1~4 는 분할 고르기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') return setFocusKey(null)
      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
        setGrid(Number(e.key) as 1 | 2 | 3 | 4)
        setPage(0)
        setFocusKey(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setGrid])

  if (status === 'error') {
    return (
      <WorkspaceTemplate aside={<CameraCounters />} right={<EventRail />} tight>
        <EmptyState icon="alert" title="카메라 목록을 불러오지 못했습니다">
          <p>서버와 연결되지 않았습니다. 5초마다 자동으로 다시 시도합니다.</p>
          {error && <p className="mt-3 type-caption text-muted/80">{error}</p>}
        </EmptyState>
      </WorkspaceTemplate>
    )
  }

  if (row === null || slots.length === 0) {
    return (
      <WorkspaceTemplate aside={<CameraCounters />} right={<EventRail />} tight>
        <EmptyState icon="camera" title="카메라 자리가 없습니다">
          이 구역에는 아직 카메라 자리가 잡혀 있지 않습니다.
        </EmptyState>
      </WorkspaceTemplate>
    )
  }

  return (
    <WorkspaceTemplate aside={<CameraCounters />} right={<EventRail />} tight>
      {/* 구역 기둥이 누운 폭에서는 구역을 옮기는 길이 여기뿐이다.
          격자 고르개를 같은 줄에 둔다 — 어디를 보나와 몇 칸으로 보나는 한 질문이고,
          아랫줄을 비워 줘야 쪽 넘기개가 가운데에 설 수 있다 */}
      <div className="on-tight plate plate-grain flex shrink-0 items-center gap-2 px-3 py-2">
        <ZonePager className="min-w-0 flex-1" />
        <LayoutPicker
          value={grid}
          onChange={(size) => {
            setGrid(size)
            setPage(0)
            setFocusKey(null)
          }}
        />
      </div>

      <div className="video-stage plate relative min-h-0 p-1">
        <CameraGrid slots={shown} size={size} focusedKey={focused} onToggleFocus={toggleFocus} />
        {/* 분할 고르개는 영상 위 오른쪽 위에 엉긴다 — 보는 것과 고르는 것이 한 자리에
            있어야 눈이 왼쪽 기둥으로 갔다 돌아오지 않는다.
            좁은 화면에서는 타일의 이름 띠와 겹쳐서 아래 줄로 내려보낸다 */}
        <div className="on-wide absolute top-3 right-3 rounded-sm bg-black/70">
          <LayoutPicker
            value={grid}
            onChange={(size) => {
              setGrid(size)
              setPage(0)
              setFocusKey(null)
            }}
          />
        </div>
      </div>

      {/* 쪽 넘기개는 영상 아래 가운데에 둔다. 영상 위에 얹으면 그만큼 화면을 가린다 */}
      {/* 넘기개만 있는 줄이라 가운데에 선다. 크게 보는 중에는 넘길 것이 없어 줄째 빠진다 */}
      {focused === null && pages > 1 && (
        <div className="plate plate-grain flex shrink-0 items-center justify-center px-4 py-1.5">
          <PagePicker
            pages={pages}
            current={current + 1}
            onPick={(p) => setPage(p - 1)}
            label={`${row.zone.name} 영상 쪽 넘기기`}
          />
        </div>
      )}
    </WorkspaceTemplate>
  )
}
