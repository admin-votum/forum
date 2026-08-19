import {forwardRef} from 'react'
import {type TextProps} from 'react-native'
import Svg, {type PathProps, type SvgProps} from 'react-native-svg'

import {flatten} from '#/alf'
import {Logomark} from './Logomark'

type Props = {
  allowVariants?: boolean
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = forwardRef<Svg, Props>(function LogoImpl(props, ref) {
  const {allowVariants: _allowVariants = true, fill, ...rest} = props
  const styles = flatten(props.style)
  const _fill = fill === 'sky' ? undefined : fill || styles?.color
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32, 10)

  return (
    <Logomark
      ref={ref}
      {...rest}
      fill={_fill}
      width={size}
      style={[{width: size, height: size * (57 / 64)}, styles]}
    />
  )
})
