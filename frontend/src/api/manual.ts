import { ai } from '@/api/http'
import type { ManualCard, ProcedureStep } from '@/types/manual'
import type { EventKind } from '@/types/event'

/**
 * 매뉴얼을 받는 자리. GET /ai/procedure/{kind} · GET /ai/cards/{kind}
 *
 * 검색도 생성도 거치지 않는다. 종류가 같으면 늘 같은 글이 오므로 모델을 거칠 이유가 없고,
 * 거치면 급한 자리에서 지연이 생기고 문장이 매번 조금씩 달라진다.
 *
 * 서버는 종류를 소문자로 받는다. 사건은 대문자(`FALL`)로 오므로 여기서 바꾼다 —
 * 화면마다 `toLowerCase()` 를 흩뿌리면 어느 쪽 표기가 맞는지 매번 확인해야 한다.
 */

const pathOf = (kind: EventKind) => kind.toLowerCase()

/**
 * 표와 네모 칸을 빈 목록으로 채워 둔다.
 *
 * 화면과 AI 서버는 따로 올라간다. 서버가 한 판 뒤처져 있으면 이 칸이 아예 오지
 * 않는데, 그대로 두면 `.length` 를 읽다가 판 전체가 하얘진다. 급한 자리에서
 * 네모 하나 없는 것과 절차가 통째로 사라지는 것은 다른 일이다.
 */
function filled<T extends { tables?: unknown[]; boxes?: unknown[] }>(rows: T[]): T[] {
  const out: T[] = []

  for (const one of rows) {
    out.push({ ...one, tables: one.tables ?? [], boxes: one.boxes ?? [] })
  }

  return out
}

/** 공통 대응 절차 여덟 단계 */
export const fetchProcedure = async (kind: EventKind, signal?: AbortSignal): Promise<ProcedureStep[]> =>
  filled((await ai.get<{ steps: ProcedureStep[] }>(`/procedure/${pathOf(kind)}`, { signal })).data.steps)

/** 유형별 대응 카드 일곱 장 */
export const fetchCards = async (kind: EventKind, signal?: AbortSignal): Promise<ManualCard[]> =>
  filled((await ai.get<{ cards: ManualCard[] }>(`/cards/${pathOf(kind)}`, { signal })).data.cards)

/**
 * 매뉴얼 원문 주소. 쪽마다 그림으로 잘라 두지 않고 PDF 를 그대로 띄운다.
 *
 * 브라우저의 PDF 보기가 스크롤·확대·검색을 해 준다. `#page=` 를 붙이면 그 쪽부터 열린다.
 */
export const manualUrl = (kind: EventKind, page?: number): string =>
  `/ai/manual/${pathOf(kind)}.pdf${page ? `#page=${page}` : ''}`
