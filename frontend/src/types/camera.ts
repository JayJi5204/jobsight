/** 백엔드 GET /api/cameras 가 돌려주는 모양 */
export interface Camera {
  id: number
  /** go2rtc 설정의 스트림 이름이자 벽에서의 자리 이름. CAM-001 */
  streamKey: string
  /** 구역 안에서 어디인지. 화면에 보이는 이름이다 */
  location: string
  /** 구역 코드. 서버 Zone enum 의 이름 그대로 — GANGNAM */
  zone: string
}

/** 화면에서 쓰는 카메라. 목록 순서대로 번호를 붙인다 */
export interface ViewCamera extends Camera {
  code: number
}

/**
 * 영상 벽의 자리 하나. 실물이 붙은 자리도, 아직 비어 있는 자리도 같은 모양이다.
 *
 * 자리를 카메라와 떼어 둔 것은, 카메라가 한 대 빠졌다고 벽의 칸이 밀려서는
 * 안 되기 때문이다. 자리는 구역이 정하고, 거기 영상이 오느냐만 달라진다.
 */
export interface CameraSlot {
  /** 자리를 가리키는 이름. 전체에서 겹치지 않고, 등록된 카메라의 streamKey 와 같은 값이다 */
  key: string
  /** 보여 줄 이름. 실물이 붙었으면 백엔드가 준 이름이 이긴다 */
  label: string
}

/**
 * 영상의 지금 상태. DB 에 저장하지 않고 화면에서만 쓴다.
 * idle 은 지금 아무도 그 영상을 보고 있지 않아 모르는 상태다.
 */
export type CameraState = 'live' | 'connecting' | 'lost' | 'idle'

/**
 * 타일·목록이 보여 주는 상태. 확인 안 된 사건이 있으면 영상 상태보다 앞서고,
 * 그때는 사건의 단계(위험·경고·주의)가 그대로 상태가 된다 — 배회 하나에
 * 화재와 같은 빨강으로 깜빡이면 경보가 무뎌진다.
 */
export type DisplayState = CameraState | 'danger' | 'warning' | 'caution'
