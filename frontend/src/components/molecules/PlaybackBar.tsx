interface Props {
  /** 지금 재생 위치(초). 끄는 중이면 끄는 자리 */
  atSec: number
  /** 지금 열어 둔 구간의 길이(초) */
  totalSec: number
  /** 끄는 중 — 영상은 그대로 두고 눈금만 따라간다. null 이면 손을 뗀 것 */
  onScrub: (sec: number | null) => void
  /** 손을 뗐다 — 그 시각부터 다시 연다 */
  onSeek: (sec: number) => void
  disabled?: boolean
}

/**
 * 열어 둔 구간 안에서 시각을 옮긴다.
 *
 * 아래 한 시간 띠와 역할이 다르다. 저쪽은 한 시간을 12px 높이에 욱여넣어 **읽는** 자리라
 * 짚은 자리가 몇 분인지 보이지 않는다. 여기는 길어야 10분을 가로 전체에 펴므로 1px 이
 * 1초 남짓이고, 그래서 짚을 수 있다.
 *
 * **끄는 동안에는 영상을 건드리지 않는다.** 시각을 옮기는 것은 영상 안에서 감는 것이
 * 아니라 그 시각부터 새로 여는 것이라, 끄는 내내 다시 열면 아무것도 재생되지 못한 채
 * 주소만 갈린다. 손을 뗄 때 한 번만 연다.
 */
export function PlaybackBar({ atSec, totalSec, onScrub, onSeek, disabled = false }: Props) {
  const max = Math.max(1, totalSec)
  const at = Math.min(Math.max(atSec, 0), max)
  const pct = (at / max) * 100

  const commit = (value: number) => {
    onScrub(null)
    onSeek(value)
  }

  return (
    <div className="relative flex h-7 shrink-0 items-center">
      <div className="sunk h-2 w-full overflow-hidden">
        <div className="h-full bg-accent/80" style={{ width: `${pct}%` }} />
      </div>

      {/* 짚고 있는 자리. 누르고 끄는 일은 아래 입력칸이 받는다 */}
      <span
        aria-hidden
        className={`pointer-events-none absolute h-4 w-1 -translate-x-1/2 rounded-[1px] ${disabled ? 'bg-muted' : 'bg-ink'}`}
        style={{ left: `${pct}%` }}
      />

      {/* 보이지 않는 입력칸이 끄는 일과 자판을 다 받는다. 직접 그리면 화살표·Home·End 와
          읽어 주는 프로그램까지 따로 만들어야 한다 */}
      <input
        type="range"
        min={0}
        max={max}
        step={0.5}
        value={at}
        disabled={disabled}
        aria-label="재생 위치"
        onChange={(e) => onScrub(Number(e.currentTarget.value))}
        onPointerUp={(e) => commit(Number(e.currentTarget.value))}
        onKeyUp={(e) => commit(Number(e.currentTarget.value))}
        className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-default"
      />
    </div>
  )
}
