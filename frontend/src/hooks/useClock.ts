import { useEffect, useState } from 'react'

/** 벽에 걸어 두는 화면이라 지금이 언제인지가 늘 보여야 한다 */
export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
