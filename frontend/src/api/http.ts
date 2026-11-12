import axios from 'axios'
import { GO2RTC_BASE } from '@/constants/stream'

/**
 * HTTP 를 거는 자리. 주소는 전부 상대 경로다 —
 * 개발에서는 vite 프록시가, 운영에서는 리버스 프록시가 넘겨 준다. 같은 출처라 CORS 가 필요 없다.
 *
 * 인터셉터를 달지 않는다. 폐쇄망이라 토큰을 실을 일이 없고(PRODUCT.md: 인증 없음),
 * 실패를 한곳에서 삼키면 화면마다 다르게 보여 줘야 할 것까지 같이 삼킨다.
 */

/** 백엔드 */
export const api = axios.create({ baseURL: '/api' })

/** go2rtc. 영상은 백엔드를 거치지 않으므로 서버가 다르다 */
export const go2rtc = axios.create({ baseURL: GO2RTC_BASE })
