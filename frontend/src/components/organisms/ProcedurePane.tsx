import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Panel } from '@/components/atoms/Panel'
import { eventLabel, SEVERITY_LABEL, SEVERITY_TEXT, severityOf } from '@/constants/events'
import { useManual } from '@/hooks/useManual'
import { groupsFor, partsOf } from '@/utils/manual'
import type { DetectionEvent } from '@/types/event'
import type { ManualBox, ManualCard, ManualTable, ProcedureStep } from '@/types/manual'

interface Props {
  event: DetectionEvent
  /** 어느 카메라인가. `강남구 · CAM-001` 처럼 구역까지 붙은 한 줄 */
  where: string
  onClose: () => void
  /** 원문을 띄워 달라는 신호. 쪽을 주면 열고 null 이면 닫는다 */
  onManual: (page: number | null) => void
  /** 지금 열려 있는 원문의 쪽. 닫혀 있으면 null */
  openPage: number | null
  className?: string
}

/** 1:07 · 12:04 */
const lasted = (ms: number): string => {
  const sec = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

/** 한 줄 사실. 이름은 자간을 벌려 값과 눈으로 갈린다 */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 px-5 py-1.5">
      <dt className="w-[4.75rem] shrink-0 whitespace-nowrap type-caption tracking-[0.22em] text-muted">{label}</dt>
      <dd className="min-w-0 type-body text-ink">{children}</dd>
    </div>
  )
}

/** 매뉴얼 표. 첫 칸이 상황, 나머지가 조치인 두 칸짜리가 대부분이다 */
function Table({ rows }: { rows: ManualTable }) {
  return (
    <table className="mt-2 w-full border-collapse">
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td
                key={j}
                className={`border border-line px-2 py-1.5 align-top type-caption leading-relaxed ${
                  j === 0 ? 'text-ink' : 'text-muted'
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * 매뉴얼이 떼어 둔 주의·참고 칸.
 *
 * 매뉴얼에서 색을 깔아 본문과 갈라 둔 자리다. 글로 풀어 섞으면 그 구분이
 * 사라지므로 여기서도 테두리를 쳐서 가른다. 주의색을 쓰는 것은 매뉴얼이
 * 그 색을 쓰기 때문이고, 주요 단추의 강조색(accent)과 겹치지 않는다.
 *
 * 줄이 하나면 한 단락의 글이고, 여럿이면 목록이다 — 하나뿐인 글에
 * 점을 찍으면 항목이 하나인 목록처럼 읽힌다.
 */
function Note({ box }: { box: ManualBox }) {
  const listed = box.items.length > 1

  return (
    <div className="mt-3 border border-caution/30 bg-caution/6 px-3 py-2">
      <p className="type-caption font-semibold text-caution">{box.title}</p>
      {box.items.map((one, i) => (
        <p key={i} className="mt-1 type-caption leading-relaxed text-ink">
          {listed ? `· ${one}` : one}
        </p>
      ))}
    </div>
  )
}

/**
 * 대응 절차.
 *
 * 사건이 뜨면 관제요원이 할 일은 정해져 있다 — 매뉴얼 3장의 여덟 단계다. 그래서 이 판은
 * 묻고 찾는 자리가 아니라 **지금 할 일 하나를 크게 보여 주는 자리**다. 끝난 단계는 접히고,
 * 아직 오지 않은 단계는 이름만 선다.
 *
 * 유형은 관제요원이 고른다. 일곱 가지뿐이라 찾을 것이 아니라 고를 것이고, 고르면 그
 * 유형에서 더 확인하고 말해야 할 것이 아래에 붙는다.
 *
 * 등급은 고르지 않는다 — 종류에서 나온다(constants/events.ts). 두 군데서 정하면
 * 어느 쪽이 맞는지 알 수 없다.
 */
export function ProcedurePane({ event, where, onClose, onManual, openPage, className = '' }: Props) {
  const { status, steps, cards, error } = useManual(event.kind)

  const [current, setCurrent] = useState(1)
  const [done, setDone] = useState<Set<string>>(() => new Set())
  const [ticked, setTicked] = useState<Set<string>>(() => new Set())
  const [card, setCard] = useState<ManualCard | null>(null)
  const [picking, setPicking] = useState(false)
  const [detailed, setDetailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // 사건이 바뀌면 처음부터 다시 센다
  useEffect(() => {
    setCurrent(1)
    setDone(new Set())
    setTicked(new Set())
    setCard(null)
    setPicking(false)
    setDetailed(false)
  }, [event.id])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const level = severityOf(event.kind)
  const elapsed = lasted(now - Date.parse(event.detectedAt))

  const step: ProcedureStep | null = steps[current - 1] ?? null
  const parts = useMemo(() => (step ? partsOf(step) : null), [step])

  // 단계를 옮기면 다시 접는다. 펴 둔 채로 넘어가면 다음 단계의 할 일이 글 아래로 밀린다
  useEffect(() => setDetailed(false), [current])

  const slots = useMemo(() => (parts ? groupsFor(card, parts.name) : []), [card, parts])

  const toggleTick = (key: string) =>
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const finishStep = () => {
    if (step === null) return
    setDone((prev) => new Set(prev).add(step.step))
    if (current < steps.length) setCurrent(current + 1)
  }

  const head = `${eventLabel(event.kind)} 대응 절차`

  return (
    <Panel
      title={head}
      action={<span className="type-caption tabular-nums text-muted">경과 {elapsed}</span>}
      className={`side-panel ${className}`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <dl className="shrink-0 border-b border-white/4 py-2">
          <Fact label="구 역">{where}</Fact>
          <Fact label="판 정">
            <span className={SEVERITY_TEXT[level]}>{eventLabel(event.kind)}</span>
          </Fact>
          <Fact label="유 형">
            <button
              type="button"
              onClick={() => setPicking((p) => !p)}
              className={`cursor-pointer text-left hover:text-accent ${card === null ? 'text-muted' : ''}`}
            >
              {card === null ? '고르기' : card.name}
            </button>
          </Fact>

          {picking && (
            <div className="mx-5 my-1 border border-line bg-accent/8">
              <p className="px-3 pt-2 pb-1 type-caption tracking-[0.12em] text-muted">무엇이었습니까</p>
              {cards.map((one) => (
                <button
                  key={one.id}
                  type="button"
                  onClick={() => {
                    setCard(one)
                    setPicking(false)
                  }}
                  className={`block w-full cursor-pointer px-3 py-2.5 text-left type-body hover:bg-white/5 ${
                    card?.id === one.id ? 'bg-accent/18 text-ink' : 'text-ink'
                  }`}
                >
                  {one.name}
                </button>
              ))}
            </div>
          )}

          <Fact label="등 급">
            <span className={SEVERITY_TEXT[level]}>{SEVERITY_LABEL[level]}</span>
          </Fact>
          {event.confidence != null && <Fact label="확신도">{event.confidence.toFixed(2)}</Fact>}
        </dl>

        {/* 고른 유형에서 매뉴얼이 떼어 둔 칸. 단계가 아니라 유형에 붙은 말이라
            고른 자리 바로 아래에 둔다 */}
        {card !== null && card.boxes.length > 0 && (
          <div className="shrink-0 px-5 pb-1">
            {card.boxes.map((box, k) => (
              <Note key={k} box={box} />
            ))}
          </div>
        )}

        {status === 'loading' && (
          <p className="px-5 py-6 type-caption text-muted">대응 절차를 받는 중입니다…</p>
        )}

        {status === 'error' && (
          <p className="px-5 py-6 type-caption leading-relaxed text-warn">
            {error ?? '대응 절차를 받지 못했습니다'}
          </p>
        )}

        {steps.map((one, i) => {
          const no = i + 1
          const isNow = no === current
          const isDone = done.has(one.step)
          const shown = isNow ? parts : null
          // 접어 둘 것이 있는가. 없으면 "자세히" 를 띄우지 않는다
          const folded =
            shown !== null &&
            (one.tables.length > 0 ||
              one.boxes.length > 0 ||
              shown.notes.length > 0 ||
              slots.length > 0)

          return (
            <div key={one.id} className={isNow ? 'border-y border-white/6 bg-white/3' : ''}>
              <button
                type="button"
                onClick={() => setCurrent(no)}
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-2.5 text-left hover:bg-white/4"
              >
                <span className={`w-4 shrink-0 text-center type-caption ${isDone ? 'text-ok' : 'text-muted'}`}>
                  {isDone ? '✓' : no}
                </span>
                <span className={`min-w-0 flex-1 type-body ${isNow ? 'font-semibold text-ink' : 'text-muted'}`}>
                  {partsOf(one).name}
                </span>
                <span className="shrink-0 type-caption tabular-nums text-muted">{one.page}쪽</span>
              </button>

              {shown && (
                <div className="px-5 pb-4">
                  <p className="type-caption leading-relaxed text-muted">{shown.what}</p>

                  {shown.checks.map((text, k) => {
                    const key = `${one.step}-${k}`
                    const on = ticked.has(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleTick(key)}
                        className="mt-2 flex w-full cursor-pointer items-start gap-2 text-left"
                      >
                        <span className={`shrink-0 type-body ${on ? 'text-ok' : 'text-accent'}`}>
                          {on ? '☑' : '☐'}
                        </span>
                        <span className={`type-body leading-relaxed ${on ? 'text-muted line-through' : 'text-ink'}`}>
                          {text}
                        </span>
                      </button>
                    )
                  })}

                  {/* 급할 때 먼저 보는 것은 체크 목록이다. 표와 곁들인 글은 접어 둔다 —
                      다 펴 놓으면 지금 할 일이 글 사이에 묻힌다 */}
                  {folded && (
                    <button
                      type="button"
                      onClick={() => setDetailed((d) => !d)}
                      className="mt-3 cursor-pointer type-caption text-muted hover:text-ink"
                    >
                      {detailed ? '▴ 접기' : '▾ 자세히'}
                    </button>
                  )}

                  {detailed && (
                    <>
                      {/* 매뉴얼이 떼어 둔 칸을 먼저 세운다. 접힌 것 중에 이게 제일 무겁다 */}
                      {one.boxes.map((box, k) => (
                        <Note key={k} box={box} />
                      ))}

                      {one.tables.map((rows, k) => (
                        <Table key={k} rows={rows} />
                      ))}

                      {/* 곁들인 글. "경찰(112): 교통 통제" 처럼 기관과 상황이 쌍이 된
                          대목은 문단이 아니라 표로 선다 — 급할 때 눈이 찾는 것은 왼쪽 칸이다 */}
                      {shown.notes.map((block, k) =>
                        block.kind === 'pairs' ? (
                          <Table key={k} rows={block.rows} />
                        ) : (
                          <p key={k} className="mt-2 type-caption leading-relaxed text-muted">
                            {block.text}
                          </p>
                        ),
                      )}

                      {/* 고른 유형에서 이 단계에 더 할 것. 매뉴얼 5장이 쓰이는 자리에 붙는다 */}
                      {slots.map((group, k) => (
                        <div key={k} className="mt-3 border-l-2 border-accent/50 bg-white/3 px-3 py-2">
                          <p className="type-caption tracking-[0.1em] text-accent">
                            {card?.name} — {group.title}
                          </p>
                          {group.items.map((item, j) => (
                            <p key={j} className="mt-1 type-caption leading-relaxed text-ink">
                              · {item}
                            </p>
                          ))}
                        </div>
                      ))}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => onManual(openPage === one.page ? null : one.page)}
                    className={`mt-3 ml-3 cursor-pointer type-caption hover:underline ${
                      openPage === one.page ? 'text-ink' : 'text-accent'
                    }`}
                  >
                    {openPage === one.page ? '원문 닫기' : `원문 ${one.page}쪽 보기`}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 셋이 한 줄에 선다. 끝내는 단추가 제일 오른쪽이다 — 오른손이 가는 자리다 */}
      <div className="flex shrink-0 items-center gap-2 border-t border-white/6 px-4 py-3">
        <Button size="sm" variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button size="sm" variant="danger" className="ml-auto">
          오탐
        </Button>
        <Button size="sm" variant="ok" onClick={finishStep} disabled={step === null}>
          {step === null ? '사건 종료' : `${partsOf(step).name} 완료`}
        </Button>
      </div>
    </Panel>
  )
}
