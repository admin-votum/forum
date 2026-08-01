import {useEffect, useMemo, useState} from 'react'
import {View} from 'react-native'

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
const MAX_ARTICLES = 6

function formatPublishedAt(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
}

function pickArticles(articles: UniverseArticle[]) {
  const science = articles.filter(article => article.category === 'science')
  const news = articles.filter(article => article.category === 'news')
  const preferred = [...science.slice(0, 4), ...news.slice(0, 2)]
  const fallback = articles.filter(article => !preferred.includes(article))

  return [...preferred, ...fallback].slice(0, MAX_ARTICLES)
}

export function UniverseNewsFeed() {
  const t = useTheme()
  const [articles, setArticles] = useState<UniverseArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    fetch(UNIVERSE_FEED_URL, {signal: controller.signal})
      .then(response => {
        if (!response.ok) throw new Error('Universe RSS feed unavailable')
        return response.json() as Promise<UniverseFeedResponse>
      })
      .then(data => {
        if (Array.isArray(data.articles)) {
          setArticles(pickArticles(data.articles))
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [])

  const visibleArticles = useMemo(
    () => articles.filter(article => article.url && article.headline),
    [articles],
  )

  if (!isLoading && visibleArticles.length === 0) return <View />

  return (
    <View
      testID="universe-news-feed"
      style={[
        a.p_lg,
        a.mb_lg,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs, a.pb_md]}>
        <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
          Universe News
        </Text>
        <Text style={[a.flex_1, a.text_xs, t.atoms.text_contrast_low]}>
          SCIENCE + WORLD RSS
        </Text>
      </View>

      {isLoading ? (
        <View style={[a.gap_sm]}>
          {Array.from({length: 3}).map((_, index) => (
            <View key={index} style={[a.gap_2xs]}>
              <View
                style={[
                  a.rounded_xs,
                  t.atoms.bg_contrast_50,
                  {height: 12, width: '92%'},
                ]}
              />
              <View
                style={[
                  a.rounded_xs,
                  t.atoms.bg_contrast_50,
                  {height: 12, width: '64%'},
                ]}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={[a.gap_sm]}>
          {visibleArticles.map((article, index) => {
            const date = formatPublishedAt(article.publishedAt)
            return (
              <Link
                key={article.id ?? article.url ?? index}
                to={article.url!}
                label={article.headline!}
                overridePresentation
                style={[
                  a.gap_2xs,
                  a.pb_sm,
                  index < visibleArticles.length - 1 && a.border_b,
                  t.atoms.border_contrast_low,
                ]}>
                <Text
                  style={[
                    a.text_sm,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}
                  numberOfLines={3}>
                  {article.headline}
                </Text>
                <Text
                  style={[a.text_xs, t.atoms.text_contrast_low]}
                  numberOfLines={1}>
                  {article.source ?? 'RSS'}
                  {article.category ? ` · ${article.category}` : ''}
                  {date ? ` · ${date}` : ''}
                </Text>
              </Link>
            )
          })}
        </View>
      )}
    </View>
  )
}
