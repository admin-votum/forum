import {useEffect, useState} from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

type NewsArticle = {
  id?: string
  headline?: string
  source?: string
  url?: string
  publishedAt?: string
  overall?: number
  spreadVal?: number
  signal?: string
}

type NewsFeedResponse = {
  articles?: NewsArticle[]
}

const ARTOFFACT_FEED_URL = 'https://votum.ink/.netlify/functions/generate-feed'
const ARTICLE_LIMIT = 5

function formatPublishedAt(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
}

export function SidebarNewsFeed() {
  const t = useTheme()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch(ARTOFFACT_FEED_URL)
      .then(response => {
        if (!response.ok) throw new Error('ArtOfFact feed unavailable')
        return response.json() as Promise<NewsFeedResponse>
      })
      .then(data => {
        if (!cancelled && Array.isArray(data.articles)) {
          setArticles(data.articles.slice(0, ARTICLE_LIMIT))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!isLoading && articles.length === 0) return null

  return (
    <View style={[a.p_lg, a.rounded_md, a.border, t.atoms.border_contrast_low]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs, a.pb_md]}>
        <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
          ArtOfFact
        </Text>
        <Text style={[a.flex_1, a.text_xs, t.atoms.text_contrast_low]}>
          NEWS SIGNAL
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
          {articles.map((article, index) => {
            if (!article.url || !article.headline) return null
            const date = formatPublishedAt(article.publishedAt)
            return (
              <Link
                key={article.id ?? article.url ?? index}
                to={article.url}
                label={article.headline}
                overridePresentation
                style={[
                  a.gap_2xs,
                  a.pb_sm,
                  index < articles.length - 1 && a.border_b,
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
                <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                  <Text
                    style={[a.text_xs, t.atoms.text_contrast_low]}
                    numberOfLines={1}>
                    {article.source ?? 'ArtOfFact'}
                  </Text>
                  {date ? (
                    <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
                      · {date}
                    </Text>
                  ) : null}
                  {typeof article.overall === 'number' ? (
                    <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
                      · {article.overall}/100
                    </Text>
                  ) : null}
                </View>
              </Link>
            )
          })}
        </View>
      )}
    </View>
  )
}
