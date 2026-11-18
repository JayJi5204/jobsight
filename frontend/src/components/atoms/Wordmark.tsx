type Props = {
  /**
   * 녹화등. 콘솔 안에서는 끈다 — 화면에서 빨강은 경보 하나만 남아야 한다.
   * 켜는 자리는 콘솔 밖(파비콘 · 문서 · 발표 자료)이다.
   */
  lamp?: 'on' | 'off'
  className?: string
}

/**
 * 이름판. `Job` 의 o 가 녹화등이자 렌즈다.
 *
 * o 를 글자로 두지 않고 원 하나로 바꿔 끼운다 — 그래야 속을 채우거나 비울 수 있고,
 * 그 원을 그대로 떼어낸 것이 파비콘이다. 지름 0.54em · 좌우 여백 0.03em · 베이스라인 아래
 * 0.01em 은 Pretendard 700 의 o 를 캔버스로 실측한 값이다(지름 0.55 · 여백 0.03 · 오버슛 0.01).
 * 테두리는 등을 끄면 실측 획 두께 0.16em 그대로라 완전한 글자로 돌아가고,
 * 켜면 0.12em 으로 깎아 속의 빨강이 먼저 읽히게 한다.
 *
 * 색은 테두리가 currentColor 를 따르므로 부르는 쪽이 정한다.
 */
export function Wordmark({ lamp = 'on', className = '' }: Props) {
  return (
    <span role="img" aria-label="JobSight" className={`font-bold whitespace-nowrap ${className}`}>
      J
      <span
        className={[
          'mx-[0.03em] -mb-[0.01em] box-border inline-block size-[0.54em] rounded-full border-current align-baseline',
          lamp === 'on' ? 'border-[0.12em] bg-crit' : 'border-[0.16em] bg-transparent',
        ].join(' ')}
      />
      bSight
    </span>
  )
}
