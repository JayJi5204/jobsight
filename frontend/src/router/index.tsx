import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/templates/MainLayout'
import { ROUTES } from '@/constants/routes'
import { EventsPage } from '@/pages/EventsPage'
import { LiveViewPage } from '@/pages/LiveViewPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { RecordingsPage } from '@/pages/RecordingsPage'

/**
 * 지도만 따로 떼어 둔다. 지도 라이브러리가 나머지 전부를 합친 것보다 커서,
 * 같이 묶으면 벽에 걸린 화면이 실시간을 띄우려고 지도 몫까지 받는다.
 * 지도는 가끔 열어 보는 화면이므로 그때 받으면 된다.
 */
const MapPage = lazy(() => import('@/pages/MapPage').then((m) => ({ default: m.MapPage })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <LiveViewPage /> },
      { path: ROUTES.RECORDINGS.slice(1), element: <RecordingsPage /> },
      { path: ROUTES.EVENTS.slice(1), element: <EventsPage /> },
      {
        path: ROUTES.MAP.slice(1),
        element: (
          <Suspense fallback={<p className="grid flex-1 place-items-center text-muted">지도를 불러오는 중…</p>}>
            <MapPage />
          </Suspense>
        ),
      },
      { path: ROUTES.SETTINGS.slice(1), element: <SettingsPage /> },
      // 없어진 주소(예전 /cameras 북마크)는 조용히 첫 화면으로 보낸다.
      // 벽에 걸린 화면에 개발자용 오류 페이지가 떠 있을 자리는 없다
      { path: '*', element: <Navigate to={ROUTES.LIVE} replace /> },
    ],
  },
])
