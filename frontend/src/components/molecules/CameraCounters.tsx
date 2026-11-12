import { ZONES } from '@/constants/zones'
import { useStreamInfo } from '@/store/streamInfo'

const SLOTS = ZONES.flatMap((z) => z.slots)

/**
 * 왼쪽 기둥 맨 위의 계수기 넷. 카메라 자리가 몇이고 그중 몇에 영상이 들어오는가.
 *
 * 세는 것은 백엔드에 등록된 카메라가 아니라 **벽에 잡혀 있는 자리** 다.
 * 등록된 것만 세면, 스물다섯 칸이 신호 없음으로 서 있는데도 계수기는
 * 0 이라고 말해 멀쩡한 화면처럼 읽힌다.
 *
 * 한 줄에 하나씩 선다 — 이름이 왼쪽, 숫자가 오른쪽. 숫자가 한 열에 모여 있으면
 * 넷을 따로 읽지 않고 기둥 하나로 훑는다.
 *
 * 사건은 세지 않는다 — 윗줄 계수기와 오른쪽 경보 칸이 이미 말한다.
 * 여기는 영상이 들어오느냐만 맡는다. 들어오거나, 안 들어오거나 둘뿐이고
 * 둘을 더하면 자리 수가 된다.
 */
export function CameraCounters() {
  const { status, byKey } = useStreamInfo()

  // 아직 go2rtc 에 물어보는 중이면 답을 기다린다. 모르는 것을 없다고 말하지 않는다
  const loaded = status !== 'loading'
  // 자리 이름이 곧 스트림 이름이다. go2rtc 가 모르는 자리는 아직 등록되지 않은 자리다
  const receiving = SLOTS.filter((s) => byKey[s.key]?.receiving).length
  const missing = loaded ? SLOTS.length - receiving : 0

  return (
    <dl className="side-counters">
      <Counter label="카메라 자리" value={SLOTS.length} />
      <Counter label="영상 수신 중" value={receiving} tone={receiving > 0 ? 'ok' : undefined} />
      <Counter label="신호 없음" value={missing} tone={missing > 0 ? 'crit' : undefined} />
    </dl>
  )
}

function Counter({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'crit' }) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'crit' ? 'text-crit-ink' : 'text-ink'
  return (
    <div className="plate plate-grain min-w-0 px-3 py-2">
      <dt className="type-caption tracking-[0.14em] whitespace-nowrap text-muted [text-shadow:var(--engrave)]">{label}</dt>
      <dd className={`type-title tabular-nums ${color}`}>{value}</dd>
    </div>
  )
}
