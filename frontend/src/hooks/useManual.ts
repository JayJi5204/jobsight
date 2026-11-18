import { useEffect, useState } from 'react'
import { fetchCards, fetchProcedure } from '@/api/manual'
import { messageOf } from '@/utils/apiError'
import type { EventKind } from '@/types/event'
import type { ManualCard, ProcedureStep } from '@/types/manual'

export interface ManualView {
  status: 'loading' | 'ready' | 'error'
  steps: ProcedureStep[]
  cards: ManualCard[]
  error: string | null
}

interface Loaded {
  steps: ProcedureStep[]
  cards: ManualCard[]
}

/**
 * 한 번 받은 종류는 다시 묻지 않는다.
 *
 * 매뉴얼은 사건마다 달라지지 않는다. 추락 사건 열 건이 연달아 떠도 절차는 같은 글이다.
 * 사건을 넘길 때마다 다시 받으면, 급한 자리에서 글이 잠깐 비었다 돌아온다.
 */
const cache = new Map<EventKind, Loaded>()

const EMPTY: Loaded = { steps: [], cards: [] }

/** 그 종류의 대응 절차와 유형 카드 */
export function useManual(kind: EventKind | null): ManualView {
  const [view, setView] = useState<ManualView>({ status: 'loading', ...EMPTY, error: null })

  useEffect(() => {
    if (kind === null) {
      setView({ status: 'ready', ...EMPTY, error: null })
      return
    }

    const had = cache.get(kind)
    if (had) {
      setView({ status: 'ready', ...had, error: null })
      return
    }

    const stop = new AbortController()
    setView({ status: 'loading', ...EMPTY, error: null })

    const load = async () => {
      try {
        const [steps, cards] = await Promise.all([
          fetchProcedure(kind, stop.signal),
          fetchCards(kind, stop.signal),
        ])
        cache.set(kind, { steps, cards })
        setView({ status: 'ready', steps, cards, error: null })
      } catch (e) {
        if (stop.signal.aborted) return
        setView({
          status: 'error',
          ...EMPTY,
          error: messageOf(e, '대응 절차를 받지 못했습니다', '서버에 연결하지 못했습니다'),
        })
      }
    }

    void load()
    return () => stop.abort()
  }, [kind])

  return view
}
