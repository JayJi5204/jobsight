/** 색이 들어간 단의 수. 사건이 없는 칸(0)은 여기에 들지 않는다 */
export const HEAT_BAND_COUNT = 5

export const HEAT_CLASS: readonly string[] = ['heat-0', 'heat-1', 'heat-2', 'heat-3', 'heat-4', 'heat-5']

/** 격자의 칸 사이 틈. 지금 시각 선이 칸의 가운데를 짚으려면 이 값을 함께 써야 한다 */
export const GRID_GAP_PX = 3

/** 카메라 이름 칸의 폭 */
export const NAME_WIDTH = '8rem'

export const HOURS_IN_DAY = 24

export const cellKey = (cameraId: number, hour: number): string => `${cameraId}:${hour}`

/**
 * 색 단계의 경계.
 *
 * 가장 많은 칸을 다섯으로 나눈 자리다. 경계는 겹치지 않게 앞 단의 끝 다음 수부터 센다
 * — `0~7` `7~15` 로 적으면 7 이 어느 단인지 알 수 없다.
 */
export const heatEdgesOf = (maxCount: number): number[] => {
  const edges: number[] = []
  for (let band = 1; band < HEAT_BAND_COUNT; band += 1) {
    const at = Math.round((band * maxCount) / HEAT_BAND_COUNT)
    edges.push(Math.max(at, (edges[band - 2] ?? 0) + 1))
  }
  return edges
}

/** 사건 수가 어느 단에 드는가. 0 은 기록이 없는 칸이다 */
export const heatLevelOf = (count: number, edges: number[]): number => {
  if (count <= 0) return 0
  const over = edges.filter((edge) => count > edge).length
  return Math.min(HEAT_BAND_COUNT, over + 1)
}

/** 범례에 적는 구간. 맨 윗단은 열어 둔다 — 닫으면 가장 많은 칸의 수가 그대로 드러난다 */
export const heatBandLabel = (level: number, edges: number[]): string => {
  if (level === 0) return '0'
  if (level === HEAT_BAND_COUNT) return `${edges[edges.length - 1] + 1} 이상`
  return `${(edges[level - 2] ?? 0) + 1}~${edges[level - 1]}`
}

/** 하루 전체를 가리키는 시간대. 끝은 포함하지 않으므로 24 다 */
export const DAY_END_HOUR = 24

/**
 * 보고 있는 시각들.
 *
 * 끝은 포함하지 않는다 — `09:00~10:00` 이 한 시간이다. 끝이 시작보다 빠르면 자정을
 * 넘긴 구간으로 읽는다. 야간 당직이 `22:00~06:00` 이라 그 구간을 적을 수 없으면
 * 당직자가 자기 근무 시간을 화면에 넣지 못한다.
 */
export const hoursInRange = (fromHour: number, toHour: number): number[] => {
  const all = Array.from({ length: HOURS_IN_DAY }, (_, i) => i)
  if (toHour > fromHour) return all.slice(fromHour, toHour)
  return [...all.slice(fromHour), ...all.slice(0, toHour)]
}

/** `09:00`. 시간대 고르개와 머리줄이 같은 꼴로 적어야 같은 값으로 읽힌다 */
export const hourText = (hour: number): string => `${String(hour).padStart(2, '0')}:00`

/** 날짜 입력칸이 쓰는 `yyyy-mm-dd`. 시간대를 붙이면 자정 근처에서 하루가 밀린다 */
export const dayText = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const daysAgoText = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return dayText(d)
}

/** `yyyy-mm-dd` 의 하루 첫 순간. 시간대를 붙여 읽으면 하루가 밀린다 */
export const startOfDayText = (text: string): number => {
  const [y, m, d] = text.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
}

export const endOfDayText = (text: string): number => {
  const [y, m, d] = text.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
}
