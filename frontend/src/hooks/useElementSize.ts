import { useEffect, useState, type RefObject } from 'react'

interface Size {
  width: number
  height: number
}

/** 칸 크기를 계산하려면 담는 쪽이 실제로 몇 픽셀인지 알아야 한다 */
export function useElementSize(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return size
}
