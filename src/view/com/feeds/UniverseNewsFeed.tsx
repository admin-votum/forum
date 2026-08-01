import {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'

import {List, type ListRef} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

type UniverseArticle = {
  id?: string
  headline?: string
  source?: string
  category?: 'science' | 'news'
  url?: string
  publishedAt?: string
}

type UniverseFeedResponse = {
  articles?: UniverseArticle[]
}

const UNIVERSE_FEED_URL = 'https://votum.ink/.netlify/functions/universe-feed'

function formatPublishedAt(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
}

function UniverseHeader() {
  const t = useTheme()

  return (
    <View style={[a.pb_lg, a.gap_2xs]}>
      <Text style={[a.text_2xl, a.font_semi_bold, t.atoms.text]}>Universe</Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        Discoveries and news articles from public RSS sources.
      </Text>
    </View>
  )
}

function UniverseLoading() {
  const t = useTheme()

  return (
    <View style={[a.gap_sm, a.py_lg]}>
      {Array.from({length: 5}).map((_, index) => (
        <View
          key={index}
          style={[
            a.p_lg,
            a.gap_sm,
            a.rounded_md,
            a.border,
            t.atoms.border_contrast_low,
          ]}>
          <View
            style={[
              a.rounded_xs,
              t.atoms.bg_contrast_50,
              {height: 14, width: '92%'},
            ]}
          />
          <View
            style={[
              a.rounded_xs,
              t.atoms.bg_contrast_50,
              {height: 14, width: '66%'},
            ]}
          />
        </View>
      ))}
    </View>
  )
}

function UniverseEmpty() {
  const t = useTheme()

  return (
    <View style={[a.py_lg]}>
      <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
        No article sources are available right now.
      </Text>
    </View>
  )
}

function UniverseArticleCard({article}: {article: UniverseArticle}) {
  const t = useTheme()

  if (!article.url || !article.headline) return null

  const date = formatPublishedAt(article.publishedAt)

  return (
    <Link
      to={article.url}
      label={article.headline}
      overridePresentation
      style={[
        a.p_lg,
        a.mb_sm,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text]}>
        {article.headline}
      </Text>
      <Text style={[a.mt_sm, a.text_xs, t.atoms.text_contrast_low]}>
        {article.source ?? 'RSS'}
        {article.category ? ` · ${article.category}` : ''}
        {date ? ` · ${date}` : ''}
      </Text>
    </Link>
  )
}

export function UniverseNewsFeed({
  enabled = true,
  headerOffset,
  scrollElRef,
  onScrolledDownChange,
}: {
  enabled?: boolean
  headerOffset?: number
  scrollElRef?: ListRef
  onScrolledDownChange?: (isScrolledDown: boolean) => void
}) {
  const [articles, setArticles] = useState<UniverseArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadFeed = useCallback(
    async (refresh = false, signal?: AbortSignal) => {
      if (refresh) setIsRefreshing(true)
      else setIsLoading(true)

      try {
        const response = await fetch(UNIVERSE_FEED_URL, {signal})
        if (!response.ok) throw new Error('Universe RSS feed unavailable')
        const data = (await response.json()) as UniverseFeedResponse
        setArticles(
          Array.isArray(data.articles)
            ? data.articles.filter(article => article.url && article.headline)
            : [],
        )
      } catch {
        if (!signal?.aborted) setArticles([])
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()

    void loadFeed(false, controller.signal)

    return () => controller.abort()
  }, [enabled, loadFeed])

  return (
    <List<UniverseArticle>
      ref={scrollElRef}
      testID="universe-news-feed"
      data={articles}
      keyExtractor={(article: UniverseArticle) =>
        article.id ?? article.url ?? article.headline ?? ''
      }
      renderItem={({item}) => <UniverseArticleCard article={item} />}
      ListHeaderComponent={UniverseHeader}
      ListEmptyComponent={isLoading ? UniverseLoading : UniverseEmpty}
      contentContainerStyle={[a.p_lg]}
      headerOffset={headerOffset}
      onScrolledDownChange={onScrolledDownChange}
      refreshing={isRefreshing}
      onRefresh={() => void loadFeed(true)}
    />
  )
}
