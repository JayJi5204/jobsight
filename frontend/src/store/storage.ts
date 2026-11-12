/**
 * 브라우저 저장소. 사생활 모드나 저장소 차단에서 예외가 나므로 늘 감싼다.
 * 여기에는 보는 사람 한 명의 편의(분할 선택 등)만 둔다. 사람이 정한 운영 정보는 백엔드로 간다.
 */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/** 저장에 실패하면 false (용량 초과 등) */
export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
