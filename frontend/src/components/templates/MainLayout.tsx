import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/organisms/layout/BottomNav'
import { TopBar } from '@/components/organisms/layout/TopBar'

/**
 * 콘솔 틀. 판들이 어두운 바탕 위에 10px 틈을 두고 앉는다 — 그 틈이 판의 경계를 만든다.
 *
 * 윗줄은 어느 화면에서나 같은 것만 담는다: 이름판 · 화면 이동 · 시각 · 사건 계수기.
 * 화면별 조작은 그 화면이 제 왼쪽 기둥에서 알아서 둔다 — 윗줄로 올려 보내지 않는다.
 *
 * 높이는 dvh 로 잡는다. 휴대폰 브라우저 주소창이 접혔다 펴져도 화면이 잘리지 않아야 한다.
 */
export function MainLayout() {
  return (
    <div className="flex h-dvh w-screen flex-col gap-2.5 overflow-hidden bg-ground p-2.5 text-ink max-md:gap-1.5 max-md:p-1.5">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
