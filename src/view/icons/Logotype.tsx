import {useEffect, useState} from 'react'
import Svg, {
  Circle,
  Path,
  type PathProps,
  type SvgProps,
  Text as SvgText,
} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'

const ratio = 17 / 64

/**
 * forum wordmark.
 *
 * Brand rule: always lowercase, and the u always has eyes.
 *
 * The u is drawn (not typeset) and fixed at the centre of the viewBox, with
 * "for" anchored to its left edge and "m" to its right. That way the eyes stay
 * inside the u no matter which serif the platform substitutes.
 */
export function Logotype({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  const ink = (fill as string) || pal.text.color
  const accent = '#FF9F1C'
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (cancelled) return
          setBlinking(true)
          timer = setTimeout(() => {
            if (cancelled) return
            setBlinking(false)
            schedule()
          }, 130)
        },
        3500 + Math.random() * 3500,
      )
    }
    schedule()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  const serif = 'Georgia, "Times New Roman", serif'

  return (
    <Svg
      fill="none"
      viewBox="0 0 64 17"
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      {/* for — anchored to the u's left edge */}
      <SvgText
        x="27.4"
        y="13"
        textAnchor="end"
        fontFamily={serif}
        fontSize="14.5"
        fill={ink}>
        for
      </SvgText>

      {/* the u — drawn, fixed at centre */}
      <Path
        d="M28.6 5.6 L28.6 9.3 A3.4 3.4 0 0 0 35.4 9.3 L35.4 5.6"
        stroke={ink}
        strokeWidth="1.15"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="30.7" cy="8.5" r="0.62" fill={accent} />
      {blinking ? (
        <Path
          d="M32.2 8.5 L34.4 8.5"
          stroke={accent}
          strokeWidth="0.62"
          strokeLinecap="round"
        />
      ) : (
        <Circle cx="33.3" cy="8.5" r="0.62" fill={accent} />
      )}

      {/* m — anchored to the u's right edge */}
      <SvgText
        x="36.6"
        y="13"
        textAnchor="start"
        fontFamily={serif}
        fontSize="14.5"
        fill={ink}>
        m
      </SvgText>
    </Svg>
  )
}
