import { useEffect, useRef, useState } from 'react'
import { CONNECT_TIMEOUT_MS, GO2RTC_COMPONENT, STALL_MS, frameUrl, streamUrl } from '@/constants/stream'
import type { CameraState } from '@/types/camera'

/**
 * 영상을 붙이는 유일한 자리. 방식을 바꾸려면 이 파일만 고치면 된다.
 *
 * go2rtc 의 웹 컴포넌트를 쓴다. WebRTC 로 붙고 안 되면 MSE 로 내려간다.
 * 그마저 실패하면 스틸 이미지를 갈아 끼워 최소한 화면은 살려 둔다.
 *
 * 상태는 스크립트가 붙었는지가 아니라 프레임이 실제로 넘어가는지로 판단한다.
 * 안전 화면에서 가장 나쁜 실패는 끊긴 영상을 살아 있다고 말하는 것이다.
 */

let componentLoading: Promise<void> | null = null

function loadComponent(): Promise<void> {
  componentLoading ??= import(/* @vite-ignore */ GO2RTC_COMPONENT).then(() => undefined)
  return componentLoading
}

interface Props {
  streamKey: string
  onStateChange?: (state: CameraState) => void
}

export function CameraStream({ streamKey, onStateChange }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    let failed = false
    let el: HTMLElement | null = null
    let video: HTMLVideoElement | null = null
    let lastTime = -1
    let lastAdvance = 0
    const started = performance.now()

    onStateChange?.('connecting')

    loadComponent()
      .then(() => {
        if (cancelled || !host.current) return
        el = document.createElement('video-stream')
        // background 를 켜야 화면 밖에 있거나 옮겨 다녀도 연결을 끊지 않는다
        ;(el as unknown as { background: boolean }).background = true
        // go2rtc 의 VideoRTC 가 http 주소를 받아 내부에서 ws 로 바꾼다
        ;(el as unknown as { src: URL }).src = streamUrl(streamKey)
        host.current.replaceChildren(el)
      })
      .catch(() => {
        if (cancelled) return
        failed = true
        setFallback(true)
      })

    // 1초마다 프레임이 넘어갔는지 본다. 스틸로 내려가면 스틸 쪽이 상태를 알린다
    const watchdog = window.setInterval(() => {
      if (failed) return
      video ??= host.current?.querySelector('video') ?? null
      const now = performance.now()
      if (video && video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime
        lastAdvance = now
      }
      if (!lastAdvance) {
        if (now - started > CONNECT_TIMEOUT_MS) onStateChange?.('lost')
        return
      }
      onStateChange?.(now - lastAdvance > STALL_MS ? 'lost' : 'live')
    }, 1000)

    return () => {
      // oxlint-disable-next-line react/immutability -- 렌더가 아니라 정리 함수에서 끄는 깃발이다
      cancelled = true
      window.clearInterval(watchdog)
      el?.remove()
    }
  }, [streamKey, onStateChange])

  if (fallback) return <StillFallback streamKey={streamKey} onStateChange={onStateChange} />
  return <div ref={host} className="h-full w-full bg-black" />
}

/** 컴포넌트를 못 불러왔을 때. 스틸을 계속 갈아 끼우고, 스틸이 들어오는 동안은 살아 있다고 본다 */
function StillFallback({ streamKey, onStateChange }: Props) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let alive = true
    let timer = 0
    const pump = () => {
      const img = new Image()
      img.onload = () => {
        if (!alive) return
        setSrc(img.src)
        onStateChange?.('live')
        timer = window.setTimeout(pump, 500)
      }
      img.onerror = () => {
        if (!alive) return
        onStateChange?.('lost')
        timer = window.setTimeout(pump, 3000)
      }
      img.src = `${frameUrl(streamKey)}&_=${Date.now()}`
    }
    pump()
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [streamKey, onStateChange])

  if (!src) return <div className="h-full w-full bg-black" />
  // 관제 영상은 잘라내지 않는다
  return <img src={src} alt="" className="h-full w-full object-contain" />
}
