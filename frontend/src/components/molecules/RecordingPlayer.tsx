import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { playbackUrl } from '@/api/playback'

interface Props {
  streamKey: string
  /** 지금 열어 둔 구간의 시작 시각. 이 값이 바뀌면 새로 연다 (= 시각 이동) */
  srcStart: number
  /** 이 구간을 몇 초까지 재생할 수 있는가 (녹화가 끊기는 곳까지) */
  durationSec: number
  playing: boolean
  rate: number
  /** 재생이 흐르는 동안의 지금 시각 */
  onProgress: (ms: number) => void
  /** 이 구간의 끝까지 재생했다 */
  onEnded: () => void
}

/**
 * 녹화 한 구간을 재생한다.
 *
 * 시각 이동은 video 안에서 하지 않고 주소를 새로 여는 것으로 한다.
 * 녹화는 하나의 긴 파일이 아니라 시각으로 잘라 달라고 요청하는 것이기 때문이다.
 */
export function RecordingPlayer({ streamKey, srcStart, durationSec, playing, rate, onProgress, onEnded }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const src = playbackUrl(streamKey, srcStart, durationSec)

  // 주소가 바뀌면 처음부터 다시 연다
  useEffect(() => {
    setFailed(false)
  }, [src])

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.playbackRate = rate
    if (playing) void v.play().catch(() => undefined)
    else v.pause()
  }, [playing, rate, src])

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={ref}
        src={src}
        className="h-full w-full object-contain"
        playsInline
        muted
        preload="auto"
        onTimeUpdate={(e) => onProgress(srcStart + e.currentTarget.currentTime * 1000)}
        onEnded={onEnded}
        onError={() => setFailed(true)}
      />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-black/85 text-center">
          <div className="grid justify-items-center gap-2 px-4">
            <Icon name="film" size={28} className="text-warn" />
            <b>이 구간을 재생하지 못했습니다</b>
            <span className="type-caption text-muted">녹화 재생 서버에 닿지 못했거나, 아직 저장되지 않은 시각입니다.</span>
          </div>
        </div>
      )}
    </div>
  )
}
