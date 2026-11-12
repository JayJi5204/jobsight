/** go2rtc 가 지금 알고 있는 스트림 상태. 저장하지 않고 그때그때 묻는다 */
export interface StreamInfo {
  /** 카메라에서 영상을 받고 있는가. go2rtc 는 보는 사람이 있을 때만 카메라에 붙는다 */
  receiving: boolean
  viewers: number
  resolution: string | null
  codec: string | null
}
