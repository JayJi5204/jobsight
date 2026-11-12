/** 녹화가 실제로 남아 있는 구간. 녹화 저장소가 생기면 여기서 받는다 */
export interface RecordingSegment {
  cameraId: number
  /** ISO 시각 */
  start: string
  end: string
}
