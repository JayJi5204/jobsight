/**
 * 매뉴얼. `GET /ai/procedure/{kind}` 와 `GET /ai/cards/{kind}` 가 돌려주는 모양 그대로다.
 *
 * 종류마다 **늘 같은 내용**이다. 사건이 바뀌어도 같은 종류면 같은 글이 온다 —
 * 매뉴얼을 고치고 다시 색인하기 전까지는.
 *
 * 글(`text`)은 매뉴얼의 줄을 그대로 이어 붙인 것이다. 첫 줄이 이름, 둘째 줄이
 * 한 줄 설명, 그 아래가 본문이다. `□` 로 시작하는 줄은 관제요원이 짚어 가는 항목이다.
 *
 * 표와 색 네모는 글에서 떼어 따로 온다. 글로 풀면 "물에 빠짐" 과 "119" 가 각각 한
 * 줄이 되어 어느 쪽이 상황이고 어느 쪽이 신고처인지 화면이 알 수 없고, 네모의 제목이
 * 앞 문장에 이어지는 말처럼 읽힌다.
 */

/** 표 한 장. 줄마다 칸이 들어 있다 */
export type ManualTable = string[][]

/**
 * 색 네모 한 칸. 매뉴얼이 "주의" 나 "참고" 로 떼어 둔 자리다.
 *
 * `items` 가 하나면 한 단락의 글이고, 여럿이면 목록이다. 매뉴얼이 그렇게 생겼다.
 */
export interface ManualBox {
  title: string
  items: string[]
}

/** 공통 대응 절차 한 단계. 매뉴얼 3장 */
export interface ProcedureStep {
  /** 조각 id. `fall-12` 같은 모양 */
  id: string
  /** `1단계` ~ `8단계` */
  step: string
  /** 매뉴얼 쪽 번호. 원문을 열 때 이 쪽부터 보여 준다 */
  page: number
  text: string
  tables: ManualTable[]
  boxes: ManualBox[]
}

/**
 * 매뉴얼에 물어본 답. `POST /ai/ask` 가 돌려주는 모양이다.
 *
 * 절차·카드와 달리 이것만 모델을 거친다. 매번 조금씩 달라지고 틀릴 수도 있어서
 * 근거 쪽을 함께 받는다 — 관제요원이 바로 원문을 펴 볼 수 있어야 한다.
 */
export interface AskSource {
  page: number
  chapter: string
  section: string
  /** 질문과 그 조각이 얼마나 가까운가. 1 에 가까울수록 가깝다 */
  similarity: number
}

export interface AskAnswer {
  answer: string
  sources: AskSource[]
}

/** 주고받은 한 쌍. 질문을 보낸 순간 만들고, 답이 오면 채운다 */
export interface AskTurn {
  id: number
  question: string
  /** 아직 기다리는 중이면 null */
  answer: AskAnswer | null
  error: string | null
}

/** 유형별 대응 카드 하나. 매뉴얼 5장 */
export interface ManualCard {
  id: string
  /** 카드 기호 `①` ~ `⑦`. 마지막은 "기타 주의 상황" 이다 */
  mark: string
  name: string
  page: number
  text: string
  tables: ManualTable[]
  boxes: ManualBox[]
}
