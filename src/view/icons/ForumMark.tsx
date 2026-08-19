import {forwardRef, useEffect, useRef, useState} from 'react'
import Svg, {
  Circle,
  Path,
  type PathProps,
  type SvgProps,
} from 'react-native-svg'

const ratio = 57 / 64

type Props = {
  fill?: PathProps['fill']
  blinkOnMount?: boolean
} & SvgProps

/** The canonical forum mark; geometry and inward eye placement never vary. */
export const ForumMark = forwardRef<Svg, Props>(function ForumMarkImpl(
  {fill, blinkOnMount = false, ...rest},
  ref,
) {
  const [blinking, setBlinking] = useState(false)
  const firstBlink = useRef(blinkOnMount)
  // @ts-ignore it's fiiiiine
  const size = parseInt(`${rest.width || 32}`)
  const ink = (fill as string) || '#E8E4DA'
  const accent = '#FF9F1C'

  useEffect(() => {
    let cancelled = false
    let closeTimer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      const timer = setTimeout(
        () => {
          if (cancelled) return
          firstBlink.current = false
          setBlinking(true)
          closeTimer = setTimeout(() => {
            if (cancelled) return
            setBlinking(false)
            schedule()
          }, 280)
        },
        firstBlink.current ? 160 : 3500 + Math.random() * 3500,
      )
      closeTimer = timer
    }
    schedule()
    return () => {
      cancelled = true
      if (closeTimer) clearTimeout(closeTimer)
    }
  }, [])

  return (
    <Svg
      fill="none"
      ref={ref}
      viewBox="0 0 64 57"
      {...rest}
      width={size}
      height={size * ratio}>
      <Path
        d="M17 13 L17 30 A15 15 0 0 0 47 30 L47 13"
        stroke={ink}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Circle cx="26" cy="26.5" r="2.9" fill={accent} />
      <Circle
        cx="38"
        cy="26.5"
        r="2.9"
        fill={accent}
        opacity={blinking ? 0 : 1}
      />
    </Svg>
  )
})
