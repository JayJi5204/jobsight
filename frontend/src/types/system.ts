/**
 * 장비 상태. 저장소와 서버를 한 번에 받아 온다.
 * 백엔드에 아직 경로가 없어 지금은 src/mocks 가 채운다.
 */
export interface SystemInfo {
  host: {
    hostname: string
    os: string
    cpu: { model: string; cores: number; usagePct: number }
    memory: { totalGB: number; usedGB: number; usagePct: number }
    uptimeS: number
  }
  storage: { mount: string; totalGB: number; usedGB: number; freeGB: number; usagePct: number }
  recording: {
    dir: string
    files: number
    sizeGB: number
    /** 실제로 남아 있는 가장 오래된 녹화까지의 시간 */
    spanHours: number | null
  }
  /**
   * 서버 설정이 쥔 보존 기간. 화면은 읽기만 한다.
   * 선택 항목이다 — 백엔드가 늦게 올라오는 동안에는 비어서 온다.
   * 필드 하나가 없다고 화면이 죽으면 안 된다.
   */
  retention?: { recordDays: number; eventDays: number }
  channels: { total: number; watching: number }
}
