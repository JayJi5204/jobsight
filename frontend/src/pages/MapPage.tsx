import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import districts from '@/assets/seoul-districts.json'
import { CameraCounters } from '@/components/molecules/CameraCounters'
import { EventRail } from '@/components/organisms/layout/EventRail'
import { WorkspaceTemplate } from '@/components/templates/WorkspaceTemplate'
import { SEVERITY_LABEL } from '@/constants/events'
import { SEOUL_BOUNDS, SEOUL_CENTER, SEOUL_FIT, TILE_ATTRIBUTION, TILE_URL, ZOOM_FLOOR, ZOOM_MAX } from '@/constants/map'
import { ROUTES } from '@/constants/routes'
import { useZones, type ZoneRow } from '@/hooks/useZones'

type Ring = [number, number][]
interface DistrictFeature {
  type: 'Feature'
  properties: { id: number; name: string }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
}
const GEO = districts as unknown as { type: 'FeatureCollection'; features: DistrictFeature[] }

const ringsOf = (f: DistrictFeature): Ring[] =>
  f.geometry.type === 'Polygon' ? (f.geometry.coordinates as Ring[]) : (f.geometry.coordinates as Ring[][]).flat()

/**
 * 서울 바깥을 덮는 보. 세계 사각형 하나를 바탕으로 두고 구 경계를 구멍으로 뚫는다.
 * 끌어서 나가지 못하게 막는 것만으로는 가장자리에 경기도가 걸쳐 보인다.
 */
const MASK = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
      ] as Ring,
      ...GEO.features.flatMap((f) => ringsOf(f)),
    ],
  },
}

/** 구 바탕 색. 단계가 있으면 그 색, 조용하면 금속 명도만 */
const FILL: Record<string, string> = {
  danger: '#ff3b2f',
  warning: '#ff8c1a',
  caution: '#ffd426',
  ok: '#36c98a',
  idle: '#79838b',
}
const ALPHA: Record<string, number> = { danger: 0.34, warning: 0.3, caution: 0.28, ok: 0.16, idle: 0.1 }

const toneOf = (row: ZoneRow): string => row.level ?? (row.slots.some((s) => s.state === 'live') ? 'ok' : 'idle')

/** 구마다 다른 값을 쓰는 식. 레이어 하나로 스물다섯 구를 칠한다 */
const byZone = <T,>(rows: ZoneRow[], pick: (row: ZoneRow) => T, fallback: T) => [
  'match',
  ['get', 'id'],
  ...rows.flatMap((row) => [row.zone.id, pick(row)]),
  fallback,
]

/**
 * 지도. 구역 스물다섯이 서울 어디에 있는지 한 장에 둔다.
 *
 * 타일 위에 구 경계를 얹고, 서울 바깥은 덮는다. 점만 찍어 두면 경계가 안 보여
 * "이 사건이 어느 구 것인가" 를 눈으로 맞출 수가 없다.
 *
 * 점은 구마다 하나, 구의 가운데에 선다. 카메라마다 점을 찍으려면 카메라 좌표가
 * 있어야 하는데 아직 없다 — 지어낸 자리를 뿌리면 그게 설치 계획처럼 읽힌다.
 *
 * 점의 숫자는 그 구역의 카메라 자리 수다. 사건 건수가 아니다 —
 * 급한 정도는 색이 말하고, 숫자는 "거기에 눈이 몇 개 있나" 를 말한다.
 */
export function MapPage() {
  const rows = useZones()
  const navigate = useNavigate()
  const host = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const pins = useRef(new Map<number, HTMLButtonElement>())
  const goRef = useRef(navigate)
  const [ready, setReady] = useState(false)
  const [tilesFailed, setTilesFailed] = useState(false)

  // 지도는 한 번만 세우므로 그 안에서 잡은 navigate 는 늙는다. 늘 최신 것을 쥐여 준다
  useEffect(() => {
    goRef.current = navigate
  }, [navigate])

  // 지도는 한 번만 세운다. 상태가 바뀔 때마다 다시 만들면 보던 자리가 튄다
  useEffect(() => {
    if (host.current === null) return
    const m = new maplibregl.Map({
      container: host.current,
      center: SEOUL_CENTER,
      zoom: ZOOM_FLOOR,
      minZoom: ZOOM_FLOOR,
      maxZoom: ZOOM_MAX,
      maxBounds: SEOUL_BOUNDS,
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          tiles: { type: 'raster', tiles: [TILE_URL], tileSize: 256, attribution: TILE_ATTRIBUTION },
          zones: { type: 'geojson', data: GEO as never },
          mask: { type: 'geojson', data: MASK as never },
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#07090a' } },
          /* 공개 타일은 밝은 원본뿐이다. 화면 전체에 CSS 필터를 씌우면 그 위의
             구역 색까지 같이 뒤집히므로, 타일 레이어만 따로 손본다 */
          {
            id: 'tiles',
            type: 'raster',
            source: 'tiles',
            paint: { 'raster-brightness-min': 0.02, 'raster-brightness-max': 1, 'raster-saturation': -0.3 },
          },
          { id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': '#000000', 'fill-opacity': 1 } },
          { id: 'zone-fill', type: 'fill', source: 'zones', paint: { 'fill-color': '#79838b', 'fill-opacity': 0.1 } },
          { id: 'zone-line', type: 'line', source: 'zones', paint: { 'line-color': '#7d8992', 'line-width': 1.1 } },
        ],
      },
    })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    /**
     * 서울이 꼭 맞게 들어오는 줌을 판 크기에서 구해 그걸 바닥으로 삼는다.
     * 판이 좁아지면 바닥도 같이 내려가야 좌우가 안 잘린다.
     */
    const frame = () => {
      const fit = m.cameraForBounds(SEOUL_FIT, { padding: 12 })
      if (fit?.zoom === undefined) return
      // 바닥에 앉아 있던 화면만 다시 맞춘다. 당겨 보던 중이면 그 자리를 뺏지 않는다
      const wasFit = m.getZoom() <= m.getMinZoom() + 0.01
      m.setMinZoom(Math.min(ZOOM_MAX, fit.zoom))
      if (wasFit) m.fitBounds(SEOUL_FIT, { padding: 12, animate: false })
    }
    m.on('load', () => {
      frame()
      /**
       * 출처 표시를 작은 ⓘ 로 접는다. **지우지는 않는다** — OSM 타일은 저작자 표시가
       * ODbL 라이선스 조건이라, 안 보이게 하면 쓸 수 없는 지도가 된다.
       * 눌러서 펴는 꼴은 그대로 남으므로 표시 의무는 지킨다.
       */
      host.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      setReady(true)
    })
    m.on('resize', frame)
    // 타일이 안 오면 검은 바탕에 구 윤곽선만 남는다. 말없이 두지 않는다
    m.on('error', (e) => {
      if ((e as { sourceId?: string }).sourceId === 'tiles') setTilesFailed(true)
    })
    m.getCanvas().style.cursor = 'default'
    map.current = m
    return () => {
      m.remove()
      map.current = null
      pins.current.clear()
    }
  }, [])

  // 구역 상태가 바뀌면 칠만 다시 한다
  useEffect(() => {
    const m = map.current
    if (m === null || !ready) return
    m.setPaintProperty('zone-fill', 'fill-color', byZone(rows, (r) => FILL[toneOf(r)], '#79838b') as never)
    m.setPaintProperty('zone-fill', 'fill-opacity', byZone(rows, (r) => ALPHA[toneOf(r)], 0.1) as never)
    m.setPaintProperty(
      'zone-line',
      'line-color',
      byZone(rows, (r) => (r.level ? FILL[r.level] : '#7d8992'), '#7d8992') as never,
    )
    m.setPaintProperty('zone-line', 'line-width', byZone(rows, (r) => (r.level ? 1.8 : 1.1), 1.1) as never)
  }, [ready, rows])

  // 구를 눌러도, 점을 눌러도 같은 자리로 간다
  useEffect(() => {
    const m = map.current
    if (m === null || !ready) return
    const go = (e: maplibregl.MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id
      if (typeof id === 'number') goRef.current(`${ROUTES.LIVE}?zone=${id}`)
    }
    const enter = () => (m.getCanvas().style.cursor = 'pointer')
    const leave = () => (m.getCanvas().style.cursor = 'default')
    m.on('click', 'zone-fill', go)
    m.on('mouseenter', 'zone-fill', enter)
    m.on('mouseleave', 'zone-fill', leave)
    return () => {
      m.off('click', 'zone-fill', go)
      m.off('mouseenter', 'zone-fill', enter)
      m.off('mouseleave', 'zone-fill', leave)
    }
  }, [ready])

  // 점과 이름표. 글자는 DOM 으로 둔다 — 지도 글꼴을 쓰면 폐쇄망에서 글리프를 또 받아야 한다
  useEffect(() => {
    const m = map.current
    if (m === null || !ready) return

    for (const row of rows) {
      const tone = toneOf(row)
      let el = pins.current.get(row.zone.id) ?? null
      if (el === null) {
        el = document.createElement('button')
        el.type = 'button'
        el.className = 'zone-marker'
        el.innerHTML = '<span class="zone-pin type-body font-bold tabular-nums"></span><span class="zone-tag"></span>'
        el.addEventListener('click', () => goRef.current(`${ROUTES.LIVE}?zone=${row.zone.id}`))
        new maplibregl.Marker({ element: el }).setLngLat(row.zone.at).addTo(m)
        pins.current.set(row.zone.id, el)
      }
      const pin = el.querySelector('.zone-pin') as HTMLElement
      const tag = el.querySelector('.zone-tag') as HTMLElement
      pin.className = `zone-pin zone-pin-${tone} type-body font-bold tabular-nums`
      pin.textContent = String(row.slots.length)
      tag.className = `zone-tag${row.level ? ` zone-tag-${row.level}` : ''}`
      tag.textContent = row.zone.name
      el.setAttribute(
        'aria-label',
        [
          row.zone.name,
          `카메라 자리 ${row.slots.length}곳`,
          row.level ? `${SEVERITY_LABEL[row.level]} ${row.pending}건 확인 필요` : '확인할 사건 없음',
        ].join(', '),
      )
    }
  }, [ready, rows])

  return (
    /* 누우면 경보 칸을 빼고 그 자리를 지도가 가져간다(rail-wide). 지도는 한 장을
       크게 보는 화면이라, 아래에 칸을 하나 더 쌓으면 서울이 그만큼 납작해진다 */
    <WorkspaceTemplate
      className="rail-wide"
      aside={<CameraCounters />}
      right={<EventRail className="on-wide" />}
    >
      <section className="plate plate-grain plate-screws flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-white/5 px-4 py-3">
          <h2 className="type-eng text-muted">지도</h2>
          <span className="flex-1" />
          <span className="type-caption text-muted tabular-nums">구역 {rows.length}</span>
        </header>

        {tilesFailed && (
          <p className="shrink-0 border-b border-line bg-warn/10 px-4 py-2 type-caption text-warn">
            지도 타일을 받지 못했습니다. 바깥 길이 막힌 자리라면 서울 타일을 서버에 얹고 `VITE_MAP_TILES` 를 그 주소로 바꿔야
            합니다.
          </p>
        )}

        <div ref={host} className="map-stage min-h-0 flex-1" />
      </section>
    </WorkspaceTemplate>
  )
}
