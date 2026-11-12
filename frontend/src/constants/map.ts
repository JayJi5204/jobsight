/**
 * 지도 타일.
 *
 * 타일은 화면에 보이는 만큼을 한 장씩 바깥에서 받아 온다. thor 에서 확인한 바로는
 * 지금 그 길이 열려 있다(2026-11-11, tile.openstreetmap.org 200). 그래서 기본값은
 * 공개 타일이다.
 *
 * 길이 막히는 자리에 놓이면 — 진짜 폐쇄망이거나, 바깥 서비스에 기대고 싶지 않으면 —
 * 서울 타일을 미리 구워 우리 서버가 내주고 여기를 그 주소로 바꾼다.
 * 그때는 `frontend/.env` 에 한 줄 적으면 된다:
 *   VITE_MAP_TILES=/tiles/{z}/{x}/{y}.png
 *
 * 영상은 이 길과 무관하다. 카메라 → go2rtc → 브라우저는 전부 안쪽에서 돈다.
 */
export const TILE_URL: string =
  import.meta.env.VITE_MAP_TILES ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

/** 우리 서버가 내주는 타일인가. 아니면 바깥 길이 끊겼을 때 지도가 빈다 */
export const TILES_ARE_LOCAL = !/^https?:\/\//.test(TILE_URL)

export const TILE_ATTRIBUTION = '© OpenStreetMap 기여자'

/**
 * 서울이 꼭 들어오는 상자. 처음 화면을 이 상자에 맞춘다.
 *
 * 경계 데이터의 실제 bbox(126.767~127.185, 37.426~37.699)에 딱 붙인다. 여기에
 * 여유를 두면 그만큼 지도가 작게 그려진다 — 휴대폰 폭에서는 그 여백이 서울보다 넓었다.
 */
export const SEOUL_FIT: [[number, number], [number, number]] = [
  [126.76, 37.42],
  [127.19, 37.705],
]

/**
 * 끌어서 나갈 수 있는 끝. **맞추는 상자보다 넉넉해야 한다.**
 *
 * 둘을 같은 값으로 두었더니 세로로 긴 화면에서 서울의 좌우가 잘렸다 — 상자 밖을
 * 못 보게 막으면, 판이 상자보다 세로로 길 때 지도가 줌을 당겨 상자로 화면을 채운다.
 * 서울 밖은 어차피 검정으로 덮으므로 조금 넘어가도 보이는 것은 달라지지 않는다.
 */
export const SEOUL_BOUNDS: [[number, number], [number, number]] = [
  [126.6, 37.25],
  [127.36, 37.87],
]

export const SEOUL_CENTER: [number, number] = [126.986, 37.5585]

/**
 * 더 줄일 수 없는 바닥. 실제 최소 줌은 **판 크기에 맞춰 그때 정한다** —
 * 9.5 로 박아 두었더니 375px 폭에서는 그 줌으로도 서울이 프레임을 넘쳐
 * 좌우가 잘렸다. 여기 값은 그 계산이 실패했을 때의 바닥일 뿐이다.
 */
export const ZOOM_FLOOR = 8
export const ZOOM_MAX = 16
