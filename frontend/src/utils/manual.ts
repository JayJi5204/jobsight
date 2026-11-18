import type { ManualCard, ProcedureStep } from '@/types/manual'

/**
 * 매뉴얼 글을 화면이 쓸 모양으로 가른다.
 *
 * 서버는 매뉴얼의 줄을 그대로 이어 붙여 보낸다. 글로 오는 이유는 매뉴얼이 글이기
 * 때문이고, 더 잘게 가르려면 PDF 의 괘선과 들여쓰기를 봐야 하는데 그건 ingest 가
 * 할 일이다. 여기서는 줄의 생김새만 보고 나눈다.
 *
 *   첫 줄        단계나 카드의 이름        "신고"
 *   둘째 줄      한 줄 설명               "출동대가 바로 찾아올 수 있게 알린다"
 *   □ 로 시작    관제요원이 짚어 가는 항목
 *   나머지       곁들인 글
 */

/** 관제요원이 짚어 가는 항목 앞에 붙는 글자 */
const BOX = '□'

/**
 * "경찰(112): 투신 시도, 사건 의심, 교통 통제"
 *
 * 전파 단계의 상황별 유관기관이 이 모양이다. 매뉴얼에서는 괘선 없는 줄로
 * 늘어서 있지만 뜻은 두 칸짜리 표다 — 왼쪽이 어디에 알리나, 오른쪽이 어떤
 * 때에 알리나. 급할 때 눈이 찾는 것은 왼쪽 칸이라 줄글로 두면 읽기 힘들다.
 */
const PAIR = /^([^:]{2,20}): (.+)$/

/** 같은 표로 묶으려면 이만큼은 모여 있어야 한다. 한 줄짜리 표는 표가 아니다 */
const PAIR_RUN = 2

export type NoteBlock =
  | { kind: 'text'; text: string }
  | { kind: 'pairs'; rows: [string, string][] }

export interface StepParts {
  name: string
  what: string
  checks: string[]
  notes: NoteBlock[]
}

/**
 * 곁들인 글을 문단과 표로 가른다.
 *
 * 상황을 적지 않은 기관이 중간에 끼어 있다("건물 관리사무소·경비실 (연락처를
 * 아는 경우)"). 거기서 표를 끊으면 한 목록이 표·글·표 셋으로 쪼개지므로,
 * 다음 줄이 다시 쌍이면 같은 표에 빈 칸으로 넣는다.
 */
function blocksOf(lines: string[]): NoteBlock[] {
  const out: NoteBlock[] = []
  let rows: [string, string][] | null = null

  for (let i = 0; i < lines.length; i += 1) {
    const one = lines[i]
    const hit = PAIR.exec(one)

    if (hit !== null) {
      if (rows === null) {
        rows = []
        out.push({ kind: 'pairs', rows })
      }
      rows.push([hit[1], hit[2]])
      continue
    }

    const nextIsPair = i + 1 < lines.length && PAIR.test(lines[i + 1])

    if (rows !== null && nextIsPair) {
      rows.push([one, ''])
      continue
    }

    rows = null
    out.push({ kind: 'text', text: one })
  }

  return settled(out)
}

/** 줄 하나뿐인 표는 표로 두지 않고 글로 되돌린다 */
function settled(blocks: NoteBlock[]): NoteBlock[] {
  const out: NoteBlock[] = []

  for (const one of blocks) {
    if (one.kind === 'pairs' && one.rows.length < PAIR_RUN) {
      for (const row of one.rows) {
        out.push({ kind: 'text', text: row[1] ? `${row[0]}: ${row[1]}` : row[0] })
      }
      continue
    }

    out.push(one)
  }

  return out
}

const linesOf = (text: string): string[] => {
  const out: string[] = []
  for (const raw of text.split('\n')) {
    const one = raw.trim()
    if (one) out.push(one)
  }
  return out
}

/** 단계 하나를 이름·설명·체크·덧붙임으로 가른다 */
export function partsOf(step: ProcedureStep): StepParts {
  const lines = linesOf(step.text)

  const checks: string[] = []
  const rest: string[] = []

  for (const one of lines.slice(2)) {
    if (one.startsWith(BOX)) checks.push(one.slice(BOX.length).trim())
    else rest.push(one)
  }

  return { name: lines[0] ?? step.step, what: lines[1] ?? '', checks, notes: blocksOf(rest) }
}

/**
 * 카드 하나를 소제목별로 가른다.
 *
 * 카드는 "CCTV에서 확인할 것" 같은 소제목 아래에 줄이 늘어선 모양이다.
 * 소제목이 무엇인지는 매뉴얼이 정해 두었으므로 그 목록으로 알아본다.
 */
const CARD_HEADS = [
  'CCTV에서 확인할 것',
  '신고할 때 꼭 말할 것',
  '신고할 곳',
  '알릴 곳',
  '추가로 알릴 곳',
]

export interface CardGroup {
  title: string
  items: string[]
}

/**
 * 카드의 어느 칸이 어느 단계에 붙는가.
 *
 * 매뉴얼 5장이 스스로 말한다 — "공통 절차를 따르면서, 해당 유형에서 더 확인하고
 * 말해야 할 것을 정리했습니다". 그러니 카드를 따로 펴 놓는 것이 아니라 그것을 쓰는
 * 단계에 붙여야 한다. 확인할 것은 확인하는 단계에, 말할 것은 신고하는 단계에.
 *
 * 단계 이름으로 맞춘다. 번호로 맞추면 배회가 어긋난다 — 배회는 3단계가 "판단" 이고
 * 4단계가 "신고·연계" 라 다른 종류와 번호가 한 칸씩 밀린다.
 */
const SLOT_OF: Record<string, string[]> = {
  'CCTV에서 확인할 것': ['확인', '판단', '지켜보기', '추적'],
  '신고할 때 꼭 말할 것': ['신고', '신고·연계'],
  '신고할 곳': ['신고', '신고·연계'],
  '알릴 곳': ['신고', '신고·연계'],
  '추가로 알릴 곳': ['신고', '신고·연계'],
}

/** 그 단계에 붙을 카드 칸만. 고른 카드가 없으면 비어 있다 */
export function groupsFor(card: ManualCard | null, stepName: string): CardGroup[] {
  if (card === null) return []

  const out: CardGroup[] = []

  for (const group of groupsOf(card)) {
    const steps = SLOT_OF[group.title]
    if (steps && steps.includes(stepName)) out.push(group)
  }

  return out
}

/** 카드 글을 소제목 묶음으로. 소제목 앞에 오는 줄은 제목 없는 묶음이 된다 */
export function groupsOf(card: ManualCard): CardGroup[] {
  const out: CardGroup[] = []
  let now: CardGroup | null = null

  for (const one of linesOf(card.text)) {
    if (CARD_HEADS.includes(one)) {
      now = { title: one, items: [] }
      out.push(now)
      continue
    }

    if (now === null) {
      now = { title: '', items: [] }
      out.push(now)
    }

    now.items.push(one)
  }

  return out
}
