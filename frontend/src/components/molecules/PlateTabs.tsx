export interface PlateTab<T extends string> {
  value: T
  label: string
}

// 길 찾기에는 색을 쓰지 않는다. 경보색을 길 찾기에 쓰면 진짜 경보가 묻힌다
const tabClass = (on: boolean) =>
  `border-b-2 px-4 py-3.5 type-body tracking-[0.04em] whitespace-nowrap transition-colors ${
    on ? 'border-[#5a646d] text-ink [text-shadow:var(--engrave)]' : 'border-transparent text-muted hover:text-ink'
  }`

/** 판 안에서 구역을 바꾸는 탭 줄. 윗줄 화면 탭과 같은 생김새를 쓴다 */
export function PlateTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly PlateTab<T>[]
  value: T
  onChange: (value: T) => void
  /** 읽어 주는 이름. 한 화면에 탭 줄이 둘이면 서로 구별돼야 한다 */
  label: string
}) {
  return (
    <nav aria-label={label} className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-b border-line px-4">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          aria-current={tab.value === value}
          className={tabClass(tab.value === value)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
