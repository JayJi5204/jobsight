import type { CameraSlot } from '@/types/camera'

/**
 * 구역 스물다섯과 그 안의 카메라 자리.
 *
 * 구역이 무엇인지는 **서버가 정한다** — `Zone` enum 이고, 카메라마다 `zone` 으로
 * 내려온다. 여기 있는 것은 그 코드에 붙는 화면 쪽 값 둘뿐이다: 지도 위의 자리와,
 * 아직 등록되지 않은 카메라 자리. 이름(`name`)은 서버가 `/api/zones` 를 열면 지운다.
 *
 * 자리 이름은 등록된 카메라의 `streamKey` 와 **같은 값**이다. 그래서 둘을 잇는 표가
 * 따로 없다 — 서버에 `CAM-014` 가 생기면 그 자리에 바로 영상이 붙는다.
 *
 * 구는 가나다순이다. 왼쪽 기둥에 스물다섯 줄이 서므로, 차례가 없으면
 * 아는 구 하나를 찾는 데도 줄을 처음부터 훑어야 한다.
 */
export interface Zone {
  id: number
  /** 서버 Zone enum 의 이름. 카메라의 zone 과 이 값으로 맞춘다 */
  code: string
  /** 실제 구 이름. 지도·기둥·사건 표가 모두 이 이름을 쓴다 */
  name: string
  /** 지도 위 자리 [경도, 위도]. 경계 안쪽 넓이 중심이라 이름표가 구 밖으로 나가지 않는다 */
  at: [number, number]
  /** 이 구역의 카메라 자리. 실물이 없는 자리도 자리로 남는다 */
  slots: readonly CameraSlot[]
}

const PLACES: readonly { id: number; code: string; name: string; at: [number, number]; cams: number }[] = [
  { id: 1, code: 'GANGNAM', name: '강남구', at: [127.0648, 37.49446], cams: 20 },
  { id: 2, code: 'GANGDONG', name: '강동구', at: [127.14905, 37.54839], cams: 20 },
  { id: 3, code: 'GANGBUK', name: '강북구', at: [127.01318, 37.64073], cams: 20 },
  { id: 4, code: 'GANGSEO', name: '강서구', at: [126.82657, 37.55827], cams: 20 },
  { id: 5, code: 'GWANAK', name: '관악구', at: [126.94807, 37.46442], cams: 20 },
  { id: 6, code: 'GWANGJIN', name: '광진구', at: [127.08877, 37.54381], cams: 20 },
  { id: 7, code: 'GURO', name: '구로구', at: [126.85892, 37.49175], cams: 20 },
  { id: 8, code: 'GEUMCHEON', name: '금천구', at: [126.90338, 37.45769], cams: 20 },
  { id: 9, code: 'NOWON', name: '노원구', at: [127.07743, 37.64933], cams: 20 },
  { id: 10, code: 'DOBONG', name: '도봉구', at: [127.03449, 37.66635], cams: 20 },
  { id: 11, code: 'DONGDAEMUN', name: '동대문구', at: [127.05742, 37.5792], cams: 20 },
  { id: 12, code: 'DONGJAK', name: '동작구', at: [126.95435, 37.49685], cams: 20 },
  { id: 13, code: 'MAPO', name: '마포구', at: [126.91191, 37.55545], cams: 20 },
  { id: 14, code: 'SEODAEMUN', name: '서대문구', at: [126.94112, 37.57465], cams: 20 },
  { id: 15, code: 'SEOCHO', name: '서초구', at: [127.03322, 37.47095], cams: 20 },
  { id: 16, code: 'SEONGDONG', name: '성동구', at: [127.04337, 37.54846], cams: 20 },
  { id: 17, code: 'SEONGBUK', name: '성북구', at: [127.02007, 37.60303], cams: 20 },
  { id: 18, code: 'SONGPA', name: '송파구', at: [127.11742, 37.50228], cams: 20 },
  { id: 19, code: 'YANGCHEON', name: '양천구', at: [126.85834, 37.522], cams: 20 },
  { id: 20, code: 'YEONGDEUNGPO', name: '영등포구', at: [126.91206, 37.51739], cams: 20 },
  { id: 21, code: 'YONGSAN', name: '용산구', at: [126.98226, 37.52964], cams: 20 },
  { id: 22, code: 'EUNPYEONG', name: '은평구', at: [126.93098, 37.61703], cams: 20 },
  { id: 23, code: 'JONGNO', name: '종로구', at: [126.97983, 37.59147], cams: 20 },
  { id: 24, code: 'JUNG', name: '중구', at: [126.99788, 37.55727], cams: 20 },
  { id: 25, code: 'JUNGNANG', name: '중랑구', at: [127.09511, 37.59516], cams: 20 },
]

/** 번호는 구를 가로질러 하나씩 올라간다 — CAM-014 하나로 어느 자리인지 집을 수 있게 */
function build(): Zone[] {
  let no = 0
  return PLACES.map((place) => ({
    id: place.id,
    code: place.code,
    name: place.name,
    at: place.at,
    slots: Array.from({ length: place.cams }, (): CameraSlot => {
      const key = `CAM-${String(++no).padStart(3, '0')}`
      return { key, label: key }
    }),
  }))
}

export const ZONES: readonly Zone[] = build()

const BY_CODE = new Map(ZONES.map((z) => [z.code, z]))

/** 서버가 준 구역 코드로 구역을 찾는다. 모르는 코드면 null — 지어내지 않는다 */
export const zoneOfCode = (code: string): Zone | null => BY_CODE.get(code) ?? null
