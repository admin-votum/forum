import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useNavigation, useNavigationState} from '@react-navigation/native'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {getCurrentRoute} from '#/lib/routes/helpers'
import {type NavigationProp} from '#/lib/routes/types'
import {emitSoftReset} from '#/state/events'
import {
  type SavedFeedSourceInfo,
  usePinnedFeedsInfos,
} from '#/state/queries/feed'
import {useSelectedFeed, useSetSelectedFeed} from '#/state/shell/selected-feed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function DesktopFeeds() {
  const t = useTheme()
  const ax = useAnalytics()
  const {data: pinnedFeedInfos, error, isLoading} = usePinnedFeedsInfos()
  const selectedFeed = useSelectedFeed()
  const setSelectedFeed = useSetSelectedFeed()
  const navigation = useNavigation<NavigationProp>()
  const route = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  if (isLoading) {
    return (
      <View style={[{gap: 10}]}>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <View
              key={i}
              style={[
                a.rounded_sm,
                t.atoms.bg_contrast_25,
                {
                  height: 16,
                  width: i % 2 === 0 ? '60%' : '80%',
                },
              ]}
            />
          ))}
      </View>
    )
  }

  if (error || !pinnedFeedInfos) {
    return null
  }

  const mainFeedInfos = pinnedFeedInfos.filter(
    feedInfo =>
      feedInfo.feedDescriptor === 'following' ||
      feedInfo.uri === DISCOVER_FEED_URI,
  )

  return (
    <View
      style={[
        a.flex_1,
        web({
          gap: 2,
          /*
           * Small padding prevents overflow prior to actually overflowing the
           * height of the screen with lots of feeds.
           */
          paddingTop: 2,
          overflowY: 'auto',
        }),
      ]}>
      {mainFeedInfos.map((feedInfo, index) => {
        const feed = feedInfo.feedDescriptor
        const current =
          route.name === 'Home' &&
          (selectedFeed ? feed === selectedFeed : index === 0)

        return (
          <FeedItem
            key={feedInfo.uri}
            feedInfo={feedInfo}
            current={current}
            onPress={() => {
              ax.metric('desktopFeeds:feed:click', {
                feedUri: feedInfo.uri,
                feedDescriptor: feed,
              })
              setSelectedFeed(feed)
              navigation.navigate('Home')
              if (route.name === 'Home' && feed === selectedFeed) {
                emitSoftReset()
              }
            }}
          />
        )
      })}
    </View>
  )
}
function FeedItem({
  feedInfo,
  current,
  onPress,
}: {
  feedInfo: SavedFeedSourceInfo
  current: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const isFollowing = feedInfo.feedDescriptor === 'following'
  const displayName =
    feedInfo.uri === DISCOVER_FEED_URI ? 'Universe' : feedInfo.displayName

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={displayName}
      accessibilityHint={_(msg`Opens ${displayName} feed`)}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.self_start,
        a.rounded_sm,
        {paddingVertical: 6, paddingHorizontal: 8},
        current && {backgroundColor: t.palette.primary_50},
      ]}>
      {isFollowing ? (
        <View
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_xs,
            {
              width: 20,
              height: 20,
              backgroundColor: t.palette.primary_500,
            },
          ]}>
          <FilterTimeline
            style={{width: 14, height: 14}}
            fill={t.palette.white}
          />
        </View>
      ) : (
        <UserAvatar
          type={feedInfo.type === 'list' ? 'list' : 'algo'}
          size={20}
          avatar={feedInfo.avatar}
          noBorder
        />
      )}
      <Text
        style={[
          a.text_md,
          a.leading_snug,
          current
            ? [t.atoms.text, a.font_semi_bold]
            : hovered
              ? t.atoms.text
              : t.atoms.text_contrast_medium,
        ]}
        numberOfLines={1}>
        {displayName}
      </Text>
    </Pressable>
  )
}
