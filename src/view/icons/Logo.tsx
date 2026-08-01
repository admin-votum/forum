import {forwardRef, useEffect, useState} from 'react'
import {type TextProps} from 'react-native'
import Svg, {
  Circle,
  Path,
  type PathProps,
  type SvgProps,
} from 'react-native-svg'

import {flatten, useTheme} from '#/alf'

const ratio = 57 / 64

type Props = {
  allowVariants?: boolean
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = forwardRef(function LogoImpl(props: Props, ref) {
  const t = useTheme()
  const {allowVariants: _allowVariants = true, fill, ...rest} = props
  const styles = flatten(props.style)
  const _fill = fill === 'sky' ? undefined : fill || styles?.color
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32, 10)

  const ink = (_fill as string) || t.atoms.text.color || '#E8E4DA'
  const accent = '#FF9F1C'

  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    let cancelled = false
    let open: ReturnType<typeof setTimeout>
    const schedule = () => {
      const delay = 3500 + Math.random() * 3500
      return setTimeout(() => {
        if (cancelled) return
        setBlinking(true)
        open = setTimeout(() => {
          if (cancelled) return
          setBlinking(false)
          schedule()
        }, 130)
      }, delay)
    }
    const first = schedule()
    return () => {
      cancelled = true
      clearTimeout(first)
      clearTimeout(open)
    }
  }, [])

  return (
    <Svg
      fill="none"
      // @ts-ignore it's fiiiiine
      ref={ref}
      viewBox="0 0 64 57"
      {...rest}
      style={[{width: size, height: size * ratio}, styles]}>
      <Path
        d="M17 13 L17 30 A15 15 0 0 0 47 30 L47 13"
        stroke={ink}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {blinking ? (
        <>
          <Path
            d="M23 26.5 L29 26.5"
            stroke={accent}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <Path
            d="M35 26.5 L41 26.5"
            stroke={accent}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <Circle cx="26" cy="26.5" r="2.9" fill={accent} />
          <Circle cx="38" cy="26.5" r="2.9" fill={accent} />
        </>
      )}
    </Svg>
  )
})
