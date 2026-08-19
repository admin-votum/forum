import {useEffect, useState} from 'react'
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  type PathProps,
  type SvgProps,
} from 'react-native-svg'

import {useTheme} from '#/alf'

const ratio = 31 / 136

export function LogomarkWithType({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const t = useTheme()
  const [blinking, setBlinking] = useState(false)
  // @ts-ignore it's fiiiiine
  const size = parseInt(`${rest.width || 136}`)
  const ink = (fill as string) || t.atoms.text.color || '#E8E4DA'
  const accent = '#FF9F1C'

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

  return (
    <Svg
      fill="none"
      viewBox="0 0 136 31"
      {...rest}
      width={size}
      height={size * ratio}>
      <Path
        d="M8 6 L8 17 A10 10 0 0 0 28 17 L28 6"
        stroke={ink}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Circle cx="14" cy="15" r="1.8" fill={accent} />
      {blinking ? (
        <Path
          d="M21 15 L25 15"
          stroke={accent}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <Circle cx="24" cy="15" r="1.8" fill={accent} />
      )}
      <SvgText
        x="37"
        y="21"
        fontFamily="Georgia, Times New Roman, serif"
        fontSize="20"
        fill={ink}>
        forum
      </SvgText>
    </Svg>
  )
}
