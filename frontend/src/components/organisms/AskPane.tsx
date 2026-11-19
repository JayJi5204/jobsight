import { useEffect, useRef, useState } from 'react'
import { useAsk } from '@/hooks/useAsk'
import type { EventKind } from '@/types/event'
import type { AskSource, AskTurn } from '@/types/manual'

interface Props {
  kind: EventKind
  /** 사건이 바뀌면 대화를 비우기 위해 받는다 */
  eventId: number
  /** 근거를 누르면 그 쪽 원문을 띄워 달라는 신호 */
  onManual: (page: number) => void
  className?: string
}

/** 종류마다 처음에 띄워 둘 질문. 급한 자리에서 타자를 치는 대신 누르게 한다 */
const EXAMPLES: Record<EventKind, string[]> = {
  FALL: [
    '목이나 척추를 다쳤을 수 있을 때',
    '어디에 신고하나요?',
    '물에 빠졌으면 무엇을 봐야 하나요?',
  ],
  FIRE: ['연기만 보이는데 신고해야 하나요?', '전기차에서 불이 났어요', '어디에 신고하나요?'],
  INTRUSION: ['흉기가 보이면 어떻게 하나요?', '어디에 신고하나요?', '방송을 해도 되나요?'],
  LOITERING: ['치매 어르신 같으면 어떻게 하나요?', '얼마나 지켜봐야 하나요?', '어디에 신고하나요?'],
}

/** "1. 119 에 신고합니다" 처럼 번호로 시작하는 줄 */
const NUMBERED = /^(\d+)\.\s+(.*)$/

/** 장 제목 앞의 번호. "2 한 장 요약" 에서 "2 " 를 뗀다 */
const CHAPTER_NO = /^\d+\s+/

/** 근거 한 칸. 누르면 그 쪽 원문이 열린다 */
function Source({ source, onManual }: { source: AskSource; onManual: (page: number) => void }) {
  // 소제목이 있으면 그게 더 좁고 정확하다. 없을 때만 장 이름으로 민다
  const label = source.section || source.chapter.replace(CHAPTER_NO, '')

  return (
    <button
      type="button"
      onClick={() => onManual(source.page)}
      title={`매뉴얼 ${source.page}쪽 보기`}
      className="cursor-pointer rounded-sm border border-line px-2 py-0.5 type-caption text-accent hover:border-accent"
    >
      {source.page}쪽 · {label}
    </button>
  )
}

/**
 * 답 한 덩이.
 *
 * 번호로 시작하는 줄은 목록으로 세운다. 모델이 "할 일이 여럿이면 번호를 붙여
 * 한 줄에 하나씩" 적도록 돼 있어서, 급한 자리에서 읽는 글은 거의 이 모양이다.
 */
function Answer({ text }: { text: string }) {
  const lines = []

  for (const raw of text.split('\n')) {
    const one = raw.trim()
    if (one) lines.push(one)
  }

  return (
    <div>
      {lines.map((one, i) => {
        const hit = NUMBERED.exec(one)

        if (hit === null) {
          return (
            <p key={i} className="type-body leading-relaxed text-ink">
              {one}
            </p>
          )
        }

        return (
          <p key={i} className="flex gap-2 type-body leading-relaxed text-ink">
            <span className="shrink-0 tabular-nums text-accent">{hit[1]}.</span>
            <span className="min-w-0">{hit[2]}</span>
          </p>
        )
      })}
    </div>
  )
}

/** 주고받은 한 쌍 */
function Turn({ turn, onManual }: { turn: AskTurn; onManual: (page: number) => void }) {
  return (
    <div className="mb-5">
      {/* 질문은 오른쪽 말풍선. 답은 왼쪽에 말풍선 없이 둔다 —
          둘 다 말풍선이면 누가 말한 것인지 모양으로 구분되지 않는다 */}
      <div className="mb-3 flex justify-end">
        <span className="max-w-[78%] rounded-xl border border-line bg-raised px-3 py-2 type-body text-ink">
          {turn.question}
        </span>
      </div>

      {turn.answer === null && turn.error === null && (
        <p className="type-caption text-muted">매뉴얼에서 찾는 중입니다…</p>
      )}

      {turn.error !== null && <p className="type-caption leading-relaxed text-warn">{turn.error}</p>}

      {turn.answer !== null && (
        <>
          <Answer text={turn.answer.answer} />

          {turn.answer.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="type-caption tracking-[0.12em] text-muted">근거</span>
              {turn.answer.sources.map((one, i) => (
                <Source key={i} source={one} onManual={onManual} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * 매뉴얼에 묻는 자리.
 *
 * 영상 아래에 늘 서 있다. 단추로 열지 않는 것은, 묻고 싶은 순간이 대개
 * 절차에 없는 상황을 만났을 때라서다 — 그때 열 곳을 찾게 하면 늦는다.
 * 절차 판을 이 창으로 갈아 끼우지도 않는다. 묻는 동안에도 지금 할 일이
 * 눈에 남아 있어야 한다.
 *
 * 여기만 모델을 거친다. 절차와 카드는 매뉴얼을 그대로 보여 주지만 이 답은
 * 만들어진 글이라, 근거 쪽을 함께 세워 바로 원문으로 갈 수 있게 한다.
 */
export function AskPane({ kind, eventId, onManual, className = '' }: Props) {
  const { turns, waiting, ask } = useAsk(kind, eventId)
  const [draft, setDraft] = useState('')

  const bottom = useRef<HTMLDivElement | null>(null)

  // 새 질문이 붙으면 아래로 따라간다
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  const send = (question: string) => {
    if (waiting) return
    ask(question)
    setDraft('')
  }

  return (
    <section className={`plate flex min-h-0 flex-col ${className}`}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/6 px-3 py-2">
        <span className="type-caption font-semibold text-accent">AI 모드</span>
        <span className="truncate type-caption text-muted/70">
          AI 대답에는 오류가 있을 수 있습니다. 급한 판단은 원문을 확인하세요.
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
        {turns.length === 0 ? (
          <div className="flex h-full flex-col justify-center gap-3 pb-2">
            <p className="type-body font-semibold text-ink">매뉴얼에 물어보세요</p>
            <p className="type-caption leading-relaxed text-muted">
              대응 매뉴얼에서 찾아 답합니다. 절차에 없는 상황이 생겼을 때 쓰십시오.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES[kind].map((one) => (
                <button
                  key={one}
                  type="button"
                  onClick={() => send(one)}
                  className="min-h-9 cursor-pointer rounded-sm border border-line bg-raised px-3 py-2 text-left type-caption text-ink hover:border-accent hover:text-accent"
                >
                  {one}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {turns.map((one) => (
              <Turn key={one.id} turn={one} onManual={onManual} />
            ))}
            <div ref={bottom} />
          </>
        )}
      </div>

      {/* 입력칸과 보내기. 엔터로 보내고 Shift+엔터로 줄을 바꾼다 —
          급할 때 손이 단추까지 가지 않아도 된다 */}
      <div className="flex shrink-0 gap-2 border-t border-white/6 px-3 py-2.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(draft)
            }
          }}
          placeholder="매뉴얼에 물어보세요"
          rows={1}
          className="min-h-12 flex-1 resize-none rounded-sm border border-line bg-ground px-3 py-2.5 type-body leading-snug text-ink placeholder:text-muted/60 focus:outline-2 focus:-outline-offset-2 focus:outline-accent"
        />
        <button
          type="button"
          onClick={() => send(draft)}
          disabled={waiting || draft.trim() === ''}
          className="min-h-12 shrink-0 cursor-pointer rounded-sm border border-accent-strong bg-accent px-4 type-body font-semibold text-ground hover:bg-accent-strong disabled:cursor-default disabled:opacity-40"
        >
          {waiting ? '…' : '보내기'}
        </button>
      </div>
    </section>
  )
}
