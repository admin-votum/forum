import {forwardRef} from 'react'
import Svg, {type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {ForumMark} from './ForumMark'

type Props = {fill?: PathProps['fill']} & SvgProps

export const Logomark = forwardRef<Svg, Props>(function LogomarkImpl(
  {fill, ...rest},
  ref,
) {
  const pal = usePalette('default')
  const ink = (fill as string) || pal.text.color || '#E8E4DA'

  return <ForumMark ref={ref} {...rest} fill={ink} />
})
