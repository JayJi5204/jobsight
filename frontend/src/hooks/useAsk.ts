import { useCallback, useEffect, useRef, useState } from 'react'
import { askManual } from '@/api/manual'
import { messageOf } from '@/utils/apiError'
import type { EventKind } from '@/types/event'
import type { AskTurn } from '@/types/manual'

export interface AskView {
  turns: AskTurn[]
  /** 답을 기다리는 중인가. 기다리는 동안에는 더 묻지 않는다 */
  waiting: boolean
  ask: (question: string) => void
}

/**
 * 매뉴얼에 물어본 것을 쌓아 둔다.
 *
 * 절차와 카드는 종류만 같으면 늘 같은 글이라 한 번 받아 두고 쓰지만(useManual),
 * 질문은 그렇지 않다. 사건마다 다른 것을 묻고, 같은 질문에도 답이 조금씩 달라진다.
 * 그래서 받아 두지 않고 그때그때 묻는다.
 *
 * 사건이 바뀌면 비운다. 앞 사건에서 묻던 것이 다음 사건 화면에 남아 있으면
 * 그 답이 지금 사건에 대한 것처럼 읽힌다.
 */
export function useAsk(kind: EventKind | null, eventId: number | null): AskView {
  const [turns, setTurns] = useState<AskTurn[]>([])
  const [waiting, setWaiting] = useState(false)

  // 사건을 넘기면 앞의 요청은 버린다. 돌아와도 앉을 자리가 없다
  const stop = useRef<AbortController | null>(null)
  const next = useRef(1)

  useEffect(() => {
    setTurns([])
    setWaiting(false)
    next.current = 1

    return () => {
      stop.current?.abort()
      stop.current = null
    }
  }, [kind, eventId])

  const ask = useCallback(
    (question: string) => {
      const text = question.trim()

      if (kind === null || !text || waiting) return

      const id = next.current
      next.current = id + 1

      setTurns((prev) => [...prev, { id, question: text, answer: null, error: null }])
      setWaiting(true)

      const control = new AbortController()
      stop.current = control

      const fill = (patch: Partial<AskTurn>) => {
        setTurns((prev) => prev.map((one) => (one.id === id ? { ...one, ...patch } : one)))
        setWaiting(false)
      }

      askManual(kind, text, control.signal)
        .then((answer) => {
          if (control.signal.aborted) return
          fill({ answer })
        })
        .catch((e) => {
          if (control.signal.aborted) return
          fill({ error: messageOf(e, '답을 받지 못했습니다', '서버에 연결하지 못했습니다') })
        })
    },
    [kind, waiting],
  )

  return { turns, waiting, ask }
}
