import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { DayDivider } from '@/components/atoms/DayDivider'
import { Panel } from '@/components/atoms/Panel'
import { EventCard } from '@/components/molecules/EventCard'
import { ROUTES } from '@/constants/routes'
import { useCameras } from '@/hooks/useCameras'
import { useEvents } from '@/store/events'
import { dayKeyOf } from '@/utils/time'

/**
 * 경보 칸. 늘 펼쳐져 있다 — 접지 않는다.
 * 찾아 들어가는 것이 아니라 하던 일을 하다가 눈에 들어와야 한다.
 * 자리가 없으면 옆이 아니라 영상 아래로 내려간다.
 *
 * 줄은 시각 순으로만 선다. 확인이 남은 것을 위로 끌어올리지 않는다 —
 * 끌어올리면 날짜 차례가 흐트러져 언제 일인지 읽을 수 없다. 대신 그 자리에서 도드라진다.
 *
 * 어느 폭까지 세울지는 화면이 정한다(`className`). 영상 벽은 좁아져도 옆에 두지만,
 * 지도는 한 장을 크게 보는 화면이라 누우면 뺀다 — 거기서 경보는 구마다 켜진 등이
 * 이미 말하고 있다.
 */
export function EventRail({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const events = useEvents()
  const { cameras } = useCameras()

  const pending = events.filter((e) => e.status === 'open').length
  const label = (id: number) => cameras.find((c) => c.id === id)?.location ?? `카메라 ${id}`

  const shown = [...events].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 30)

  return (
    <Panel
      title="경보"
      action={
        <span className={`type-caption font-semibold tabular-nums ${pending > 0 ? 'text-warn' : 'text-muted'}`}>
          미확인 {pending}건
        </span>
      }
      className={`side-panel ${className}`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {shown.length === 0 ? (
          <p className="px-2 py-4 text-center type-caption leading-snug text-muted">
            경보가 없습니다. 탐지 기능이 연결되면 여기에 뜹니다.
          </p>
        ) : (
          shown.map((e, i) => {
            // 날이 바뀌는 자리에만 날짜를 세운다
            const newDay = i === 0 || dayKeyOf(e.detectedAt) !== dayKeyOf(shown[i - 1].detectedAt)
            return (
              <Fragment key={e.id}>
                {newDay && <DayDivider at={e.detectedAt} />}
                <EventCard event={e} cameraLabel={label(e.cameraId)} onOpen={() => navigate(`${ROUTES.EVENTS}?event=${e.id}`)} />
              </Fragment>
            )
          })
        )}
      </div>
    </Panel>
  )
}
