import {useCallback, useMemo} from 'react'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {type RenderTabBarFnProps} from '#/view/com/pager/Pager'
import {TabBar} from '../pager/TabBar'
import {HomeHeaderLayout} from './HomeHeaderLayout'

export function HomeHeader(
  props: RenderTabBarFnProps & {
    testID?: string
    onPressSelected: () => void
    feeds: FeedSourceInfo[]
  },
) {
  const {feeds, onSelect: onSelectProp} = props

  const items = useMemo(() => {
    const pinnedNames = feeds.map(f =>
      f.uri === DISCOVER_FEED_URI ? 'Universe' : f.displayName,
    )
    return pinnedNames
  }, [feeds])

  const onSelect = useCallback(
    (index: number) => {
      onSelectProp?.(index)
    },
    [onSelectProp],
  )

  return (
    <HomeHeaderLayout tabBarAnchor={props.tabBarAnchor}>
      <TabBar
        key={items.join(',')}
        onPressSelected={props.onPressSelected}
        selectedPage={props.selectedPage}
        onSelect={onSelect}
        testID={props.testID}
        items={items}
        dragProgress={props.dragProgress}
        dragState={props.dragState}
        transparent
      />
    </HomeHeaderLayout>
  )
}
