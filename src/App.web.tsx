import './style.css'

import {useCallback, useEffect, useState} from 'react'
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {ForumMark} from './view/icons/ForumMark'

const API = 'https://votum.ink/.netlify/functions'
const FEED_API =
  typeof window === 'undefined'
    ? API
    : window.location.hostname === 'localhost'
      ? 'http://localhost:9999/.netlify/functions'
      : '/.netlify/functions'
const ACCESS_TOKEN_KEY = 'frm.accessToken'
const REFRESH_TOKEN_KEY = 'frm.refreshToken'

type FrmProfile = {
  id: string
  handle: string
  display_name: string
  bio?: string
  avatar_url?: string | null
  cover_url?: string | null
  kind?: 'profile' | 'voice'
  world_voice_id?: string
  category?: string
  role?: string
}

type FrmWorldVoice = {
  handle: string
  displayName: string
  category: string
  role: string
  bio: string
  avatar_url: string
  avatar?: string
}

type FrmArticle = {
  id?: string
  headline?: string
  source?: string
  url?: string
  publishedAt?: string
  category?: string
  image?: string
  likes_count?: number
  comments_count?: number
  viewer_liked?: boolean
  comments?: FrmArticleComment[]
}

type FrmMindRead = {
  model: string
  score: number
  read: string
}

type FrmVerification = {
  demo?: boolean
  models: FrmMindRead[]
  spread: number
  failures?: string[]
}

type FrmArticleComment = {
  id: string
  article_url: string
  parent_id?: string | null
  body: string
  created_at: string
  author: FrmProfile
}

type FrmPost = {
  id: string
  body: string
  created_at: string
  author: FrmProfile
  likes_count?: number
  comments_count?: number
  reposts_count?: number
  viewer_liked?: boolean
  viewer_reposted?: boolean
  comments?: FrmComment[]
}

type FrmComment = {
  id: string
  post_id: string
  parent_id?: string | null
  body: string
  created_at: string
  author: FrmProfile
}

type ThreadComment = {
  id: string
  parent_id?: string | null
  body: string
  created_at: string
  author: FrmProfile
}

type Session = {
  accessToken: string
  refreshToken?: string | null
  profile: FrmProfile
  email?: string
}

type AuthCallback = {
  accessToken: string
  refreshToken?: string
}

type FeedTab = 'universe' | 'politics' | 'following'

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  baseUrl = API,
) {
  const response = await fetch(`${baseUrl}/${path}`, {
    ...options,
    headers: {
      ...(options.body ? {'Content-Type': 'application/json'} : {}),
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(options.headers || {}),
    },
  })
  const data = (await response.json().catch(() => ({}))) as T & {error?: string}
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`)
  return data
}

function readStoredSession(): Session | null {
  if (typeof window === 'undefined') return null
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  const rawProfile = window.localStorage.getItem('frm.profile')
  if (!accessToken || !rawProfile) return null
  try {
    return {accessToken, profile: JSON.parse(rawProfile) as FrmProfile}
  } catch {
    return null
  }
}

function saveSession(session: Session) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  if (session.refreshToken)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  window.localStorage.setItem('frm.profile', JSON.stringify(session.profile))
}

function clearSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem('frm.profile')
}

function readAuthCallback(): AuthCallback | null {
  if (typeof window === 'undefined' || !window.location.hash) return null

  const params = new URLSearchParams(window.location.hash.slice(1))
  const accessToken = params.get('access_token')
  if (!accessToken) return null

  return {
    accessToken,
    refreshToken: params.get('refresh_token') || undefined,
  }
}

function clearAuthCallbackUrl() {
  if (typeof window === 'undefined') return
  window.history.replaceState(
    {},
    document.title,
    `${window.location.pathname}${window.location.search}`,
  )
}

function dateLabel(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
}

type SharePayload = {
  title: string
  text: string
  url: string
}

function forumArticleShareUrl(articleUrl: string) {
  return `https://frm.ink/?article=${encodeURIComponent(articleUrl)}`
}

async function copyShareUrl(url: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      // Try the legacy browser path below when clipboard permissions reject.
    }
  }

  const input = document.createElement('textarea')
  input.value = url
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)

  try {
    input.select()
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(input)
  }
}

async function shareOrCopy(
  payload: SharePayload,
  onMessage: (message: string) => void,
) {
  let copied = false

  try {
    copied = await copyShareUrl(payload.url)
  } catch {
    copied = false
  }

  const webNavigator = navigator as Navigator & {
    share?: (data: SharePayload) => Promise<void>
  }

  if (typeof webNavigator.share === 'function') {
    onMessage(
      copied
        ? 'Link copied — choose where to share it.'
        : 'Choose where to share it.',
    )
    try {
      await webNavigator.share(payload)
      onMessage('Shared.')
      return
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      onMessage(
        copied
          ? 'Link copied. Share menu unavailable.'
          : 'Share menu unavailable. Open the article and copy its URL.',
      )
      return
    }
  }

  onMessage(
    copied
      ? 'Link copied. Paste it here or anywhere.'
      : 'Copy failed. Open the article and copy its URL.',
  )
}

function BrandGlyph({compact = false}: {compact?: boolean}) {
  return (
    <ForumMark
      accessibilityLabel="forum logo"
      accessibilityHint="The forum brand mark"
      width={compact ? 26 : 42}
    />
  )
}

function BrandHeader() {
  return (
    <View style={styles.brandHeader}>
      <BrandGlyph />
      <Text style={styles.wordmark}>forum</Text>
    </View>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() =>
    readStoredSession(),
  )
  const [universeArticles, setUniverseArticles] = useState<FrmArticle[]>([])
  const [politicsArticles, setPoliticsArticles] = useState<FrmArticle[]>([])
  const [posts, setPosts] = useState<FrmPost[]>([])
  const [following, setFollowing] = useState<FrmProfile[]>([])
  const [worldVoices, setWorldVoices] = useState<FrmWorldVoice[]>([])
  const [tab, setTab] = useState<FeedTab>('universe')
  const [view, setView] = useState<'feed' | 'profile' | 'voices'>('feed')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authCallbackPending, setAuthCallbackPending] = useState(() =>
    Boolean(readAuthCallback()),
  )

  const loadArticleStream = useCallback(
    async (stream: 'universe' | 'politics', accessToken?: string) => {
      const data = await request<{articles?: FrmArticle[]}>(
        `forum-feed?stream=${stream}`,
        {},
        undefined,
        FEED_API,
      )
      let nextArticles: Array<
        FrmArticle & {category: 'universe' | 'politics'}
      > = (data.articles || []).map(article => ({
        ...article,
        category: stream,
      }))
      const urls = nextArticles
        .map(article => article.url)
        .filter(Boolean) as string[]

      if (accessToken && urls.length) {
        try {
          const interactions = await request<{
            interactions?: Array<FrmArticle & {articleUrl: string}>
          }>(
            `frm-universe-interactions?urls=${encodeURIComponent(JSON.stringify(urls))}`,
            {},
            accessToken,
          )
          const byUrl = new Map(
            (interactions.interactions || []).map(item => [
              item.articleUrl,
              item,
            ]),
          )
          nextArticles = nextArticles.map(article => ({
            ...article,
            ...(article.url ? byUrl.get(article.url) : undefined),
            category: article.category,
          }))
        } catch {
          // The public feed should still render if its optional social layer is
          // briefly unavailable during a deploy or migration.
        }
      }

      return nextArticles
    },
    [],
  )

  const loadUniverse = useCallback(
    async (accessToken?: string) => {
      const nextArticles = await loadArticleStream('universe', accessToken)
      setUniverseArticles(nextArticles)
    },
    [loadArticleStream],
  )

  const loadPolitics = useCallback(
    async (accessToken?: string) => {
      const nextArticles = await loadArticleStream('politics', accessToken)
      setPoliticsArticles(nextArticles)
    },
    [loadArticleStream],
  )

  const loadFollowing = useCallback(async (accessToken: string) => {
    const [feed, people] = await Promise.all([
      request<{posts?: FrmPost[]}>('frm-following-feed', {}, accessToken),
      request<{following?: FrmProfile[]}>('frm-following', {}, accessToken),
    ])
    setPosts(feed.posts || [])
    setFollowing(people.following || [])
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        await Promise.all([
          loadUniverse(session?.accessToken),
          loadPolitics(session?.accessToken),
        ])
      } catch (err) {
        if (active) setError(String(err instanceof Error ? err.message : err))
      }

      if (active && session) {
        try {
          await loadFollowing(session.accessToken)
        } catch (err) {
          if (!active) return
          const message = String(err instanceof Error ? err.message : err)
          if (message.toLowerCase().includes('expired session')) {
            clearSession()
            setSession(null)
            setPosts([])
            setFollowing([])
            setError('')
          } else {
            setError(message)
          }
        }
      }

      if (active) setLoading(false)
    }

    void load()
    return () => {
      active = false
    }
  }, [loadFollowing, loadPolitics, loadUniverse, session])

  useEffect(() => {
    let active = true
    void request<{voices?: FrmWorldVoice[]}>(
      'forum-world-voices',
      {},
      undefined,
      FEED_API,
    )
      .then(data => {
        if (active) setWorldVoices(data.voices || [])
      })
      .catch(() => {
        // The voice directory is additive; the feed should remain usable if it is offline.
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const callback = readAuthCallback()
    if (!callback) {
      setAuthCallbackPending(false)
      return
    }

    clearAuthCallbackUrl()
    let active = true
    void request<{profile: FrmProfile}>('frm-me', {}, callback.accessToken)
      .then(me => {
        if (!active) return
        const next: Session = {
          accessToken: callback.accessToken,
          refreshToken: callback.refreshToken,
          profile: me.profile,
        }
        saveSession(next)
        setSession(next)
      })
      .catch(() => {
        if (active) setError('Email confirmation finished. Please sign in.')
      })
      .finally(() => active && setAuthCallbackPending(false))

    return () => {
      active = false
    }
  }, [])

  const onAuth = (next: Session) => {
    saveSession(next)
    setSession(next)
    setError('')
    setView('feed')
    setTab('following')
  }

  const onLogout = () => {
    clearSession()
    setSession(null)
    setPosts([])
    setFollowing([])
    setUniverseArticles([])
    setPoliticsArticles([])
    setTab('universe')
    setView('feed')
  }

  const articles = [...universeArticles, ...politicsArticles]
  const feedArticles =
    tab === 'universe'
      ? universeArticles
      : tab === 'politics'
        ? politicsArticles
        : articles
  const visibleArticles = feedArticles.filter(article => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return `${article.headline || ''} ${article.source || ''}`
      .toLowerCase()
      .includes(query)
  })

  if (!session && authCallbackPending) {
    return (
      <View style={styles.authOuter}>
        <ActivityIndicator color="#CBA6F7" />
      </View>
    )
  }

  if (!session)
    return <AuthScreen onAuth={onAuth} articles={articles} loading={loading} />

  return (
    <View style={styles.app}>
      <View style={styles.sidebar}>
        <BrandHeader />
        <View style={styles.sidebarNav}>
          <SidebarNavButton
            icon="⌂"
            label="Home"
            active={view === 'feed' && tab === 'following'}
            onPress={() => {
              setView('feed')
              setTab('following')
            }}
          />
          <SidebarNavButton
            icon="⌕"
            label="Explore"
            onPress={() => {
              setView('feed')
              setTab('universe')
            }}
          />
          <SidebarNavButton icon="◯" label="Notifications" />
          <SidebarNavButton icon="✉" label="Chat" />
          <SidebarNavButton
            icon="#"
            label="Feeds"
            active={
              view === 'feed' && (tab === 'universe' || tab === 'politics')
            }
            onPress={() => {
              setView('feed')
              setTab('universe')
            }}
          />
          <SidebarNavButton icon="☷" label="Lists" />
          <SidebarNavButton icon="▢" label="Saved" />
          <SidebarNavButton
            icon="◉"
            label="Profile"
            active={view === 'profile'}
            onPress={() => setView('profile')}
          />
          <SidebarNavButton
            icon="✦"
            label="Voices"
            active={view === 'voices'}
            onPress={() => setView('voices')}
          />
          <SidebarNavButton icon="⚙" label="Settings" />
        </View>
        <Pressable
          style={styles.newPostButton}
          onPress={() => {
            setView('feed')
            setTab('following')
          }}>
          <Text style={styles.newPostButtonText}>＋ New post</Text>
        </Pressable>
        <View style={styles.sidebarSpacer} />
        <Text style={styles.handle}>@{session.profile.handle}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityHint="Sign out of this forum account"
          onPress={onLogout}
          style={styles.logout}>
          <Text style={styles.muted}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.centerColumn}>
        {view === 'feed' ? (
          <View style={styles.topTabs}>
            <View pointerEvents="none" style={styles.topTabBrand}>
              <BrandGlyph compact />
            </View>
            <FeedTab
              label="Following"
              active={tab === 'following'}
              onPress={() => {
                setTab('following')
              }}
            />
            <FeedTab
              label="Universe"
              active={tab === 'universe'}
              onPress={() => {
                setTab('universe')
              }}
            />
            <FeedTab
              label="Politics"
              active={tab === 'politics'}
              onPress={() => {
                setTab('politics')
              }}
            />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator color="#CBA6F7" style={styles.loader} />
        ) : null}

        {view === 'voices' ? (
          <WorldVoicesView
            voices={worldVoices}
            token={session.accessToken}
            following={following}
            onRefresh={() => loadFollowing(session.accessToken)}
          />
        ) : view === 'profile' ? (
          <ProfileView
            profile={session.profile}
            posts={posts.filter(post => post.author.id === session.profile.id)}
            following={following}
            token={session.accessToken}
            onProfileUpdated={profile => {
              const next = {...session, profile}
              saveSession(next)
              setSession(next)
            }}
          />
        ) : tab === 'universe' ? (
          <UniverseView
            articles={visibleArticles}
            token={session.accessToken}
            onRefresh={() => loadUniverse(session.accessToken)}
            title="Universe"
            subtitle="Discoveries and science from ArtOfFact RSS sources."
          />
        ) : tab === 'politics' ? (
          <UniverseView
            articles={visibleArticles}
            token={session.accessToken}
            onRefresh={() => loadPolitics(session.accessToken)}
            title="Politics"
            subtitle="Political and world news from deFramed RSS sources."
          />
        ) : (
          <FollowingView
            posts={posts}
            following={following}
            token={session.accessToken}
            onRefresh={() => loadFollowing(session.accessToken)}
          />
        )}
      </View>
      <RightRail
        articles={visibleArticles}
        voices={worldVoices}
        search={search}
        onSearch={setSearch}
        tab={tab}
        view={view}
        onTab={value => {
          setView('feed')
          setTab(value)
        }}
      />
    </View>
  )
}

function SidebarNavButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string
  label: string
  active?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={`Show the ${label.toLowerCase()} feed`}
      onPress={onPress}
      style={[
        styles.sidebarNavButton,
        active && styles.sidebarNavButtonActive,
      ]}>
      <Text
        style={[styles.sidebarIcon, active && styles.sidebarNavLabelActive]}>
        {icon}
      </Text>
      <Text
        style={[
          styles.sidebarNavLabel,
          active && styles.sidebarNavLabelActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  )
}

function FeedTab({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.feedTab, active && styles.feedTabActive]}>
      <Text style={[styles.feedTabText, active && styles.feedTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  )
}

function CommentThread({
  comments,
  draft,
  onDraftChange,
  onSubmit,
  onReply,
  replyingTo,
  onCancelReply,
  inputLabel,
  submitLabel,
  disabled = false,
}: {
  comments: ThreadComment[]
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onReply: (comment: ThreadComment) => void
  replyingTo?: ThreadComment | null
  onCancelReply: () => void
  inputLabel: string
  submitLabel: string
  disabled?: boolean
}) {
  const orderedComments = [...comments].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  )
  const childrenByParent: Record<string, ThreadComment[]> = {}
  const roots: ThreadComment[] = []
  const commentIds = new Set(orderedComments.map(comment => comment.id))

  orderedComments.forEach(comment => {
    if (comment.parent_id && commentIds.has(comment.parent_id)) {
      childrenByParent[comment.parent_id] = childrenByParent[comment.parent_id] || []
      childrenByParent[comment.parent_id].push(comment)
    } else {
      roots.push(comment)
    }
  })

  const threadedComments: ThreadComment[] = []
  const visited = new Set<string>()
  const appendThread = (comment: ThreadComment) => {
    if (visited.has(comment.id)) return
    visited.add(comment.id)
    threadedComments.push(comment)
    childrenByParent[comment.id]?.forEach(appendThread)
  }
  roots.forEach(appendThread)
  orderedComments.forEach(appendThread)

  const renderComment = (comment: ThreadComment) => (
    <View
      key={comment.id}
      style={[
        styles.commentThreadItem,
      ]}>
      <View pointerEvents="none" style={styles.commentThreadRail} />
      <View style={styles.comment}>
        <View style={styles.commentIdentityRow}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {comment.author.handle.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>@{comment.author.handle}</Text>
              <Text style={styles.commentTime}>
                · {dateLabel(comment.created_at)}
              </Text>
            </View>
            <Text style={styles.commentBody}>{comment.body}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reply to @${comment.author.handle}`}
              onPress={() => onReply(comment)}
              style={styles.commentReplyButton}>
              <Text style={styles.commentReplyText}>Reply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.commentThread}>
      <View style={styles.commentThreadHeader}>
        <Text style={styles.commentThreadTitle}>
          {comments.length
            ? `${comments.length} ${comments.length === 1 ? 'signal' : 'signals'}`
            : 'Start the conversation'}
        </Text>
        <Text style={styles.commentThreadHint}>
          A focused thread around this article
        </Text>
      </View>
      {threadedComments.map(renderComment)}
      {!comments.length ? (
        <Text style={styles.commentEmpty}>Be the first signal in the thread.</Text>
      ) : null}
      <View style={styles.commentComposer}>
        {replyingTo ? (
          <View style={styles.replyTargetRow}>
            <Text style={styles.replyTargetText}>
              Replying to @{replyingTo.author.handle}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
              onPress={onCancelReply}>
              <Text style={styles.commentReplyText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.commentComposerRow}>
          <TextInput
            accessibilityLabel={inputLabel}
            value={draft}
            onChangeText={onDraftChange}
            placeholder="Write a reply…"
            placeholderTextColor="#8f8aa3"
            style={styles.commentInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
            onPress={onSubmit}
            disabled={disabled || !draft.trim()}
            style={styles.commentButton}>
            <Text style={styles.commentButtonText}>Reply</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

function UniverseView({
  articles,
  token,
  onRefresh,
  title,
  subtitle,
}: {
  articles: FrmArticle[]
  token: string
  onRefresh: () => Promise<void>
  title: string
  subtitle: string
}) {
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [replyTargets, setReplyTargets] = useState<
    Record<string, ThreadComment | null>
  >({})
  const [verification, setVerification] = useState<
    Record<string, FrmVerification>
  >({})
  const [openVerification, setOpenVerification] = useState<
    Record<string, boolean>
  >({})
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  const toggleLike = async (article: FrmArticle) => {
    if (!article.url) return
    setBusy(`${article.url}:like`)
    try {
      await request(
        'frm-universe-like',
        {
          method: article.viewer_liked ? 'DELETE' : 'POST',
          body: JSON.stringify({articleUrl: article.url}),
        },
        token,
      )
      await onRefresh()
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusy('')
    }
  }

  const comment = async (article: FrmArticle) => {
    if (!article.url) return
    const draft = commentDrafts[article.url]?.trim()
    if (!draft) return
    const replyTarget = replyTargets[article.url]
    setBusy(`${article.url}:comment`)
    try {
      await request(
        'frm-universe-comment',
        {
          method: 'POST',
          body: JSON.stringify({
            articleUrl: article.url,
            body: draft,
            parentCommentId: replyTarget?.id || null,
          }),
        },
        token,
      )
      setCommentDrafts(current => ({...current, [article.url as string]: ''}))
      setReplyTargets(current => ({...current, [article.url as string]: null}))
      setOpenComments(current => ({...current, [article.url as string]: true}))
      setMessage('Comment added.')
      await onRefresh()
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusy('')
    }
  }

  const share = async (article: FrmArticle) => {
    if (!article.url) return
    const forumUrl = forumArticleShareUrl(article.url)
    await shareOrCopy(
      {
        title: `${article.headline || 'Article'} · forum`,
        text: `Open this article in forum's Universe: ${article.headline || 'Read this article'}`,
        url: forumUrl,
      },
      setMessage,
    )
  }

  const verify = async (article: FrmArticle) => {
    if (!article.url) return
    const key = article.url
    const cached = verification[key]
    if (cached) {
      setOpenVerification(current => ({...current, [key]: !current[key]}))
      return
    }

    setBusy(`${key}:verify`)
    try {
      const result = await request<FrmVerification>(
        'forum-verify',
        {
          method: 'POST',
          body: JSON.stringify({
            title: article.headline,
            source: article.source,
          }),
        },
        undefined,
        FEED_API,
      )
      setVerification(current => ({...current, [key]: result}))
      setOpenVerification(current => ({...current, [key]: true}))
      setMessage(
        result.demo
          ? 'Independent reads loaded in demonstration mode.'
          : 'Independent reads loaded. Disagreement is visible.',
      )
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusy('')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.feed}>
      <View style={styles.feedIntro}>
        <Text style={styles.feedIntroTitle}>{title}</Text>
        <Text style={styles.feedIntroSubtitle}>{subtitle}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
      {articles.length ? (
        articles.map((article, index) => {
          const key = article.url || article.id || String(index)
          const result = article.url ? verification[article.url] : undefined
          const verificationIsOpen = article.url
            ? openVerification[article.url]
            : false

          return (
            <View key={key} style={styles.article}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={article.headline || 'Open article'}
                accessibilityHint="Open this article"
                onPress={() => {
                  if (article.url) void Linking.openURL(article.url)
                }}>
                {article.image ? (
                  <Image
                    accessibilityLabel={`${article.source || 'Article'} image`}
                    source={{uri: article.image}}
                    style={styles.articleImage}
                  />
                ) : null}
                <Text style={styles.articleHeadline}>
                  {article.headline || 'Untitled article'}
                </Text>
                <Text style={styles.meta}>
                  {article.source || 'Unknown source'} ·{' '}
                  {dateLabel(article.publishedAt)}
                </Text>
              </Pressable>
              <View style={styles.articleActions}>
                <PostActionButton
                  icon={article.viewer_liked ? '♥' : '♡'}
                  label={`${article.likes_count || 0}`}
                  active={article.viewer_liked}
                  accessibilityLabel={
                    article.viewer_liked ? 'Unlike article' : 'Like article'
                  }
                  onPress={() => void toggleLike(article)}
                />
                <PostActionButton
                  icon="◌"
                  label={`${article.comments_count || 0}`}
                  active={openComments[article.url || '']}
                  accessibilityLabel="Comment on article"
                  onPress={() => {
                    if (!article.url) return
                    setOpenComments(current => ({
                      ...current,
                      [article.url as string]: !current[article.url as string],
                    }))
                  }}
                />
                <PostActionButton
                  icon="↗"
                  label="Share"
                  accessibilityLabel="Share article"
                  onPress={() => void share(article)}
                />
                <PostActionButton
                  icon="✦"
                  label={busy === `${article.url}:verify` ? 'Reading' : 'Read'}
                  active={verificationIsOpen}
                  accessibilityLabel="Read independent frames"
                  onPress={() => void verify(article)}
                />
              </View>
              {result && verificationIsOpen ? (
                <View style={styles.verificationPanel}>
                  <View style={styles.verificationHeader}>
                    <Text style={styles.verificationTitle}>
                      Independent reads
                    </Text>
                    <Text style={styles.verificationHint}>
                      framing check · not a factual verdict
                    </Text>
                  </View>
                  {result.models.map(model => (
                    <View key={model.model} style={styles.verificationRead}>
                      <View style={styles.verificationReadHeader}>
                        <Text style={styles.verificationModel}>
                          {model.model}
                        </Text>
                        <Text style={styles.verificationScore}>
                          {Math.round(model.score)}
                        </Text>
                      </View>
                      <Text style={styles.verificationText}>{model.read}</Text>
                    </View>
                  ))}
                  <Text style={styles.verificationSpread}>
                    Spread ±{Math.round(result.spread)} · disagreement is signal
                  </Text>
                  {result.demo ? (
                    <Text style={styles.verificationDemo}>
                      Demonstration reads are shown until live verifier keys are
                      configured.
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {article.url && openComments[article.url] ? (
                <View style={styles.commentBox}>
                  <CommentThread
                    comments={article.comments || []}
                    draft={commentDrafts[article.url] || ''}
                    onDraftChange={value =>
                      setCommentDrafts(current => ({
                        ...current,
                        [article.url as string]: value,
                      }))
                    }
                    onSubmit={() => void comment(article)}
                    onReply={item => {
                      setReplyTargets(current => ({
                        ...current,
                        [article.url as string]: item,
                      }))
                    }}
                    replyingTo={replyTargets[article.url]}
                    onCancelReply={() =>
                      setReplyTargets(current => ({
                        ...current,
                        [article.url as string]: null,
                      }))
                    }
                    inputLabel={`Comment on ${article.source || 'article'}`}
                    submitLabel="Post article comment"
                    disabled={busy === `${article.url}:comment`}
                  />
                </View>
              ) : null}
            </View>
          )
        })
      ) : (
        <Text style={styles.empty}>No articles match that search.</Text>
      )}
    </ScrollView>
  )
}

function RightRail({
  articles,
  voices,
  search,
  onSearch,
  tab,
  view,
  onTab,
}: {
  articles: FrmArticle[]
  voices: FrmWorldVoice[]
  search: string
  onSearch: (value: string) => void
  tab: FeedTab
  view: 'feed' | 'profile' | 'voices'
  onTab: (value: FeedTab) => void
}) {
  return (
    <View style={styles.rightRail}>
      <TextInput
        accessibilityLabel="Search"
        placeholder="⌕  Search"
        placeholderTextColor="#8F8AA3"
        value={search}
        onChangeText={onSearch}
        style={styles.searchInput}
      />
      <View style={styles.railFeedMenu}>
        <Pressable
          style={[
            styles.railFeedButton,
            view === 'feed' &&
              tab === 'following' &&
              styles.railFeedButtonActive,
          ]}
          onPress={() => onTab('following')}>
          <Text style={styles.railFeedIcon}>☷</Text>
          <Text style={styles.railFeedLabel}>Following</Text>
        </Pressable>
        <Pressable
          style={[
            styles.railFeedButton,
            view === 'feed' &&
              tab === 'universe' &&
              styles.railFeedButtonActive,
          ]}
          onPress={() => onTab('universe')}>
          <Text style={styles.railFeedIcon}>◉</Text>
          <Text style={styles.railFeedLabel}>Universe</Text>
        </Pressable>
        <Pressable
          style={[
            styles.railFeedButton,
            view === 'feed' &&
              tab === 'politics' &&
              styles.railFeedButtonActive,
          ]}
          onPress={() => onTab('politics')}>
          <Text style={styles.railFeedIcon}>◈</Text>
          <Text style={styles.railFeedLabel}>Politics</Text>
        </Pressable>
      </View>
      <View style={styles.signalCard}>
        <Text style={styles.signalTitle}>
          {tab === 'politics'
            ? 'Politics · NEWS SIGNAL'
            : 'Universe · DISCOVERY SIGNAL'}
        </Text>
        {articles.slice(0, 5).map((article, index) => (
          <Pressable
            key={article.id || article.url || index}
            style={styles.signalItem}
            onPress={() => {
              if (article.url) void Linking.openURL(article.url)
            }}>
            {article.image ? (
              <Image
                accessibilityLabel={`${article.source || 'Article'} image`}
                source={{uri: article.image}}
                style={styles.signalImage}
              />
            ) : null}
            <Text style={styles.signalHeadline} numberOfLines={3}>
              {article.headline || 'Untitled article'}
            </Text>
            <Text style={styles.signalMeta}>
              {article.source || 'Public RSS'} ·{' '}
              {dateLabel(article.publishedAt)}
            </Text>
          </Pressable>
        ))}
        {!articles.length ? (
          <Text style={styles.muted}>No signal yet.</Text>
        ) : null}
      </View>
      <View style={styles.voiceSignalCard}>
        <View style={styles.voiceSignalHeader}>
          <Text style={styles.signalTitle}>World voices</Text>
          <Text style={styles.voiceCount}>{voices.length || '—'}</Text>
        </View>
        <Text style={styles.voiceSignalHint}>
          Love connects. Sarcasm keeps the room honest.
        </Text>
        <View style={styles.voicePreviewGrid}>
          {voices.slice(0, 8).map(voice => (
            <View key={voice.handle} style={styles.voicePreviewItem}>
              <Image
                accessibilityLabel={`${voice.displayName} avatar`}
                source={{uri: voice.avatar_url}}
                style={styles.voicePreviewAvatar}
              />
              <Text style={styles.voicePreviewName} numberOfLines={1}>
                @{voice.handle}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.railFooter}>
        Public RSS sources · headlines link to publishers
      </Text>
    </View>
  )
}

type DirectoryPerson = {
  id?: string
  handle: string
  display_name: string
  bio?: string
  avatar_url?: string | null
  kind?: 'profile' | 'voice'
  category?: string
  role?: string
}

function WorldVoicesView({
  voices,
  token,
  following,
  onRefresh,
}: {
  voices: FrmWorldVoice[]
  token: string
  following: FrmProfile[]
  onRefresh: () => Promise<void>
}) {
  const localPeople: DirectoryPerson[] = voices.map(voice => ({
    handle: voice.handle,
    display_name: voice.displayName,
    bio: voice.bio,
    avatar_url: voice.avatar_url,
    kind: 'voice',
    category: voice.category,
    role: voice.role,
  }))
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<DirectoryPerson[]>(localPeople)
  const [busyHandle, setBusyHandle] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setPeople(localPeople)
  }, [voices])

  const searchPeople = async (value = query) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setPeople(localPeople)
      setMessage('')
      return
    }

    try {
      const data = await request<{people?: DirectoryPerson[]}>(
        `frm-people-search?q=${encodeURIComponent(trimmed)}`,
        {},
        token,
      )
      setPeople(data.people || [])
      setMessage('')
    } catch {
      const localMatches = localPeople.filter(person =>
        `${person.handle} ${person.display_name} ${person.category || ''} ${person.role || ''}`
          .toLowerCase()
          .includes(trimmed.toLowerCase()),
      )
      setPeople(localMatches)
      setMessage(
        localMatches.length
          ? 'Showing the local voice directory while people search reconnects.'
          : 'People search is unavailable right now.',
      )
    }
  }

  const toggleFollow = async (person: DirectoryPerson) => {
    const currentlyFollowing = following.some(item => item.handle === person.handle)
    setBusyHandle(person.handle)
    try {
      await request(
        'frm-following',
        {
          method: currentlyFollowing ? 'DELETE' : 'POST',
          body: JSON.stringify({handle: person.handle}),
        },
        token,
      )
      await onRefresh()
      setMessage(currentlyFollowing ? `Unfollowed @${person.handle}.` : `Following @${person.handle}.`)
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusyHandle('')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.voiceDirectory}>
      <View style={styles.feedIntro}>
        <Text style={styles.feedIntroTitle}>World voices</Text>
        <Text style={styles.feedIntroSubtitle}>
          A living vocabulary of concepts, objects, forces, and named things.
          Search any name or handle, open the profile card, and bring a voice
          into the room.
        </Text>
      </View>
      <View style={styles.voiceSearchBox}>
        <TextInput
          accessibilityLabel="Search people and world voices"
          accessibilityHint="Search by display name or handle"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => void searchPeople()}
          placeholder="Search people or voices"
          placeholderTextColor="#8F928F"
          autoCapitalize="none"
          style={styles.voiceSearchInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search people and voices"
          onPress={() => void searchPeople()}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Search</Text>
        </Pressable>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.voiceDirectoryCount}>
        {query.trim() ? `${people.length} result${people.length === 1 ? '' : 's'}` : `${people.length} voices`}
      </Text>
      <View style={styles.voiceDirectoryGrid}>
        {people.map(person => (
          <View key={person.handle} style={styles.voiceDirectoryCard}>
            <Image
              accessibilityLabel={`${person.display_name} avatar`}
              source={person.avatar_url ? {uri: person.avatar_url} : undefined}
              style={styles.voiceDirectoryAvatar}
            />
            <View style={styles.voiceDirectoryText}>
              <Text style={styles.voiceDirectoryName}>{person.display_name}</Text>
              <Text style={styles.voiceDirectoryHandle}>
                @{person.handle}{person.kind === 'voice' ? ' · world voice' : ''}
              </Text>
              <Text style={styles.voiceDirectoryBio} numberOfLines={2}>
                {person.bio || 'A forum account ready to join the room.'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${following.some(item => item.handle === person.handle) ? 'Unfollow' : 'Follow'} @${person.handle}`}
              onPress={() => void toggleFollow(person)}
              disabled={busyHandle === person.handle}
              style={[
                styles.voiceFollowButton,
                following.some(item => item.handle === person.handle) && styles.voiceFollowButtonActive,
              ]}>
              <Text style={styles.voiceFollowButtonText}>
                {following.some(item => item.handle === person.handle) ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>
        ))}
        {!people.length ? <Text style={styles.muted}>No people or voices found.</Text> : null}
      </View>
    </ScrollView>
  )
}

function FollowingView({
  posts,
  following,
  token,
  onRefresh,
}: {
  posts: FrmPost[]
  following: FrmProfile[]
  token: string
  onRefresh: () => Promise<void>
}) {
  const [handle, setHandle] = useState('')
  const [body, setBody] = useState('')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [replyTargets, setReplyTargets] = useState<
    Record<string, ThreadComment | null>
  >({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const follow = async () => {
    if (!handle.trim()) return
    setBusy(true)
    try {
      await request(
        'frm-following',
        {method: 'POST', body: JSON.stringify({handle})},
        token,
      )
      setHandle('')
      setMessage('Following updated.')
      await onRefresh()
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  const publish = async () => {
    if (!body.trim()) return
    setBusy(true)
    try {
      await request(
        'frm-post',
        {method: 'POST', body: JSON.stringify({body})},
        token,
      )
      setBody('')
      setMessage('Posted.')
      await onRefresh()
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  const togglePostAction = async (post: FrmPost, action: 'like' | 'repost') => {
    setBusy(true)
    try {
      const active =
        action === 'like' ? post.viewer_liked : post.viewer_reposted
      await request(
        action === 'like' ? 'frm-post-like' : 'frm-post-repost',
        {
          method: active ? 'DELETE' : 'POST',
          body: JSON.stringify({postId: post.id}),
        },
        token,
      )
      await onRefresh()
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  const comment = async (post: FrmPost) => {
    const draft = commentDrafts[post.id]?.trim()
    if (!draft) return
    const replyTarget = replyTargets[post.id]
    setBusy(true)
    try {
      await request(
        'frm-post-comment',
        {
          method: 'POST',
          body: JSON.stringify({
            postId: post.id,
            body: draft,
            parentCommentId: replyTarget?.id || null,
          }),
        },
        token,
      )
      setCommentDrafts(current => ({...current, [post.id]: ''}))
      setReplyTargets(current => ({...current, [post.id]: null}))
      setOpenComments(current => ({...current, [post.id]: true}))
      setMessage('Comment added.')
      await onRefresh()
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  const share = async (post: FrmPost) => {
    const url = `https://frm.ink/?post=${encodeURIComponent(post.id)}`
    await shareOrCopy(
      {
        title: `@${post.author.handle} on forum`,
        text: post.body,
        url,
      },
      setMessage,
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.feed}>
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Post text"
          accessibilityHint="Write a post for forum"
          value={body}
          onChangeText={setBody}
          placeholder="Share something with forum…"
          placeholderTextColor="#8f8aa3"
          multiline
          style={styles.composerInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post"
          accessibilityHint="Publish this post"
          onPress={() => void publish()}
          disabled={busy || !body.trim()}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Post</Text>
        </Pressable>
      </View>
      <View style={styles.followBox}>
        <Text style={styles.sectionTitle}>Follow a forum account</Text>
        <Text style={styles.muted}>
          Use an exact handle, or open Voices to search living profiles and
          bring them into your Following feed.
        </Text>
        <View style={styles.followRow}>
          <TextInput
            accessibilityLabel="forum handle to follow"
            accessibilityHint="Enter an exact forum handle"
            value={handle}
            onChangeText={setHandle}
            placeholder="handle"
            placeholderTextColor="#8f8aa3"
            style={styles.followInput}
            autoCapitalize="none"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Follow account"
            accessibilityHint="Follow the exact forum handle"
            onPress={() => void follow()}
            disabled={busy || !handle.trim()}
            style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Follow</Text>
          </Pressable>
        </View>
        {following.length ? (
          <Text style={styles.muted}>
            Following: {following.map(person => `@${person.handle}`).join(', ')}
          </Text>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
      {posts.length ? (
        posts.map(post => (
          <View key={post.id} style={styles.post}>
            <Text style={styles.postAuthor}>
              {post.author.display_name || `@${post.author.handle}`}{' '}
              <Text style={styles.meta}>
                @{post.author.handle} · {dateLabel(post.created_at)}
              </Text>
            </Text>
            <Text style={styles.postBody}>{post.body}</Text>
            <View style={styles.postActions}>
              <PostActionButton
                icon={post.viewer_liked ? '♥' : '♡'}
                label={`${post.likes_count || 0}`}
                active={post.viewer_liked}
                accessibilityLabel={post.viewer_liked ? 'Unlike' : 'Like'}
                onPress={() => void togglePostAction(post, 'like')}
              />
              <PostActionButton
                icon="◌"
                label={`${post.comments_count || 0}`}
                accessibilityLabel="Comment"
                onPress={() =>
                  setOpenComments(current => ({
                    ...current,
                    [post.id]: !current[post.id],
                  }))
                }
              />
              <PostActionButton
                icon={post.viewer_reposted ? '↻' : '⟳'}
                label={`${post.reposts_count || 0}`}
                active={post.viewer_reposted}
                accessibilityLabel={
                  post.viewer_reposted ? 'Undo repost' : 'Repost'
                }
                onPress={() => void togglePostAction(post, 'repost')}
              />
              <PostActionButton
                icon="↗"
                label="Share"
                accessibilityLabel="Share"
                onPress={() => void share(post)}
              />
            </View>
            {openComments[post.id] ? (
              <View style={styles.commentBox}>
                <CommentThread
                  comments={post.comments || []}
                  draft={commentDrafts[post.id] || ''}
                  onDraftChange={value =>
                    setCommentDrafts(current => ({
                      ...current,
                      [post.id]: value,
                    }))
                  }
                  onSubmit={() => void comment(post)}
                  onReply={item => {
                    setReplyTargets(current => ({
                      ...current,
                      [post.id]: item,
                    }))
                  }}
                  replyingTo={replyTargets[post.id]}
                  onCancelReply={() =>
                    setReplyTargets(current => ({
                      ...current,
                      [post.id]: null,
                    }))
                  }
                  inputLabel={`Comment on ${post.author.handle}'s post`}
                  submitLabel="Post comment"
                  disabled={busy}
                />
              </View>
            ) : null}
          </View>
        ))
      ) : (
        <Text style={styles.empty}>
          No forum posts yet. Universe is ready when you are.
        </Text>
      )}
    </ScrollView>
  )
}

function PostActionButton({
  icon,
  label,
  active,
  accessibilityLabel,
  onPress,
}: {
  icon: string
  label: string
  active?: boolean
  accessibilityLabel: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.postAction, active && styles.postActionActive]}>
      <Text style={styles.postActionIcon}>{icon}</Text>
      {label ? <Text style={styles.postActionLabel}>{label}</Text> : null}
    </Pressable>
  )
}

function ProfileView({
  profile,
  posts,
  following,
  token,
  onProfileUpdated,
}: {
  profile: FrmProfile
  posts: FrmPost[]
  following: FrmProfile[]
  token: string
  onProfileUpdated: (profile: FrmProfile) => void
}) {
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [profileTab, setProfileTab] = useState<
    'posts' | 'replies' | 'media' | 'likes'
  >('posts')

  const saveProfile = async () => {
    setBusy(true)
    try {
      const data = await request<{profile: FrmProfile}>(
        'frm-profile',
        {
          method: 'PATCH',
          body: JSON.stringify({displayName, bio}),
        },
        token,
      )
      onProfileUpdated(data.profile)
      setDisplayName(data.profile.display_name)
      setBio(data.profile.bio || '')
      setMessage('Profile saved.')
    } catch (err) {
      setMessage(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.feed, styles.profileFeed]}>
      <View style={styles.profileCover}>
        {profile.cover_url ? (
          <Image
            accessibilityLabel="Profile cover image"
            source={{uri: profile.cover_url}}
            style={styles.profileCoverImage}
          />
        ) : (
          <View style={styles.profileCoverFallback}>
            <View style={[styles.coverOrb, styles.coverOrbOne]} />
            <View style={[styles.coverOrb, styles.coverOrbTwo]} />
            <View style={[styles.coverOrb, styles.coverOrbThree]} />
            <View style={styles.coverGridLineOne} />
            <View style={styles.coverGridLineTwo} />
            <View style={styles.coverGridLineThree} />
            <Text style={styles.coverLabel}>ANALYTICAL INTELLIGENCE</Text>
            <Text style={styles.coverSubLabel}>
              human signal · silicon memory
            </Text>
          </View>
        )}
      </View>
      <View style={styles.profileIdentityRow}>
        <View style={styles.profileAvatarRing}>
          {profile.avatar_url ? (
            <Image
              accessibilityLabel="Profile avatar"
              source={{uri: profile.avatar_url}}
              style={styles.profileAvatarImage}
            />
          ) : (
            <BrandGlyph compact />
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Close profile editor' : 'Edit profile'}
          onPress={() => setEditing(current => !current)}
          style={styles.profileActionButton}>
          <Text style={styles.profileActionButtonText}>
            {editing ? 'Done' : 'Edit profile'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.profileHero}>
        <Text style={styles.profileDisplayName}>
          {profile.display_name || `@${profile.handle}`}
        </Text>
        <Text style={styles.profileHandle}>@{profile.handle}</Text>
        {profile.bio ? (
          <Text style={styles.profileBio}>{profile.bio}</Text>
        ) : null}
        <Text style={styles.profileStats}>
          {posts.length} posts · {following.length} following
        </Text>
      </View>
      <View style={styles.profileTabs}>
        {(['posts', 'replies', 'media', 'likes'] as const).map(tab => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityLabel={tab}
            onPress={() => setProfileTab(tab)}
            style={[
              styles.profileTab,
              profileTab === tab && styles.profileTabActive,
            ]}>
            <Text
              style={[
                styles.profileTabText,
                profileTab === tab && styles.profileTabTextActive,
              ]}>
              {tab[0].toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      {editing ? (
        <View style={styles.profileEditor}>
          <Text style={styles.sectionTitle}>Edit profile</Text>
          <TextInput
            accessibilityLabel="Profile display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor="#8f8aa3"
            style={styles.profileInput}
          />
          <TextInput
            accessibilityLabel="Profile bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the forum a little about yourself"
            placeholderTextColor="#8f8aa3"
            multiline
            style={[styles.profileInput, styles.profileBioInput]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save profile"
            onPress={() => void saveProfile()}
            disabled={busy}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {busy ? 'Saving…' : 'Save profile'}
            </Text>
          </Pressable>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      ) : null}
      {profileTab === 'posts' ? (
        <>
          <Text style={styles.profilePostsTitle}>Posts</Text>
          {posts.length ? (
            posts.map(post => (
              <View key={post.id} style={styles.post}>
                <Text style={styles.postBody}>{post.body}</Text>
                <Text style={styles.meta}>{dateLabel(post.created_at)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Your forum posts will appear here.</Text>
          )}
        </>
      ) : (
        <Text style={styles.empty}>No {profileTab} yet.</Text>
      )}
    </ScrollView>
  )
}

function AuthScreen({
  onAuth,
  articles,
  loading,
}: {
  onAuth: (session: Session) => void
  articles: FrmArticle[]
  loading: boolean
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [handle, setHandle] = useState('')
  const [quickHandle, setQuickHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [quickBusy, setQuickBusy] = useState(false)
  const [error, setError] = useState('')

  const localPreview =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'

  const enterLocalHandle = async () => {
    setQuickBusy(true)
    setError('')
    try {
      const data = await request<{
        user: {email?: string}
        accessToken: string
        refreshToken?: string
      }>(
        'forum-dev-login',
        {
          method: 'POST',
          body: JSON.stringify({handle: quickHandle}),
        },
        undefined,
        FEED_API,
      )
      const me = await request<{profile: FrmProfile}>(
        'frm-me',
        {},
        data.accessToken,
      )
      onAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        profile: me.profile,
        email: data.user?.email,
      })
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setQuickBusy(false)
    }
  }

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const data =
        mode === 'login'
          ? await request<{
              user: {email?: string}
              accessToken: string
              refreshToken?: string
            }>('frm-auth-login', {
              method: 'POST',
              body: JSON.stringify({email, password}),
            })
          : await request<{
              user: {email?: string}
              accessToken: string | null
              refreshToken?: string | null
              emailConfirmationRequired?: boolean
            }>('frm-auth-signup', {
              method: 'POST',
              body: JSON.stringify({email, password, handle}),
            })
      if (!data.accessToken) {
        setError(
          'Check your email to confirm your forum account, then sign in.',
        )
        return
      }
      const me = await request<{profile: FrmProfile}>(
        'frm-me',
        {},
        data.accessToken,
      )
      onAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        profile: me.profile,
        email: data.user?.email,
      })
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.authPage}>
      <View style={styles.authCard}>
        <BrandHeader />
        <Text style={styles.authEyebrow}>A small signal for a wide world.</Text>
        <Text style={styles.authSubtitle}>
          A calm place for discoveries, articles, and forum conversations.
        </Text>
        {mode === 'signup' ? (
          <TextInput
            accessibilityLabel="forum handle"
            accessibilityHint="Enter your forum handle"
            value={handle}
            onChangeText={setHandle}
            placeholder="forum handle"
            placeholderTextColor="#8f8aa3"
            autoCapitalize="none"
            style={styles.input}
          />
        ) : null}
        <TextInput
          accessibilityLabel="Email"
          accessibilityHint="Enter your email address"
          value={email}
          onChangeText={setEmail}
          placeholder="email"
          placeholderTextColor="#8f8aa3"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Password"
          accessibilityHint="Enter your password"
          value={password}
          onChangeText={setPassword}
          placeholder="password"
          placeholderTextColor="#8f8aa3"
          secureTextEntry
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            mode === 'login' ? 'Sign in' : 'Create forum account'
          }
          accessibilityHint={
            mode === 'login'
              ? 'Sign in to your forum account'
              : 'Create your forum account'
          }
          onPress={() => void submit()}
          disabled={busy}
          style={styles.primaryButton}>
          {busy ? (
            <ActivityIndicator color="#1E1E2E" />
          ) : (
            <View style={styles.buttonContent}>
              {mode === 'signup' ? <BrandGlyph compact /> : null}
              <Text style={styles.primaryButtonText}>
                {mode === 'login' ? 'Sign in' : 'Create forum account'}
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            mode === 'login'
              ? 'Create a new forum account'
              : 'Already have an account? Sign in'
          }
          accessibilityHint="Switch between sign in and account creation"
          onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login'
              ? 'Create a new forum account'
              : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
        {localPreview ? (
          <View style={styles.localLoginBox}>
            <Text style={styles.localLoginTitle}>Local test entry</Text>
            <Text style={styles.localLoginHint}>
              Use a council handle without typing the test password.
            </Text>
            <TextInput
              accessibilityLabel="Local handle"
              value={quickHandle}
              onChangeText={setQuickHandle}
              placeholder="@plato"
              placeholderTextColor="#8F928F"
              autoCapitalize="none"
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enter local test account"
              onPress={() => void enterLocalHandle()}
              disabled={quickBusy || !quickHandle.trim()}
              style={styles.secondaryButton}>
              {quickBusy ? (
                <ActivityIndicator color="#ECE6DA" />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  Enter as @{quickHandle.replace(/^@/, '') || 'handle'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
      <View style={styles.publicNews}>
        <Text style={styles.publicNewsTitle}>Universe</Text>
        <Text style={styles.publicNewsIntro}>
          Live discoveries and news from public RSS sources. No forum posts in
          this feed.
        </Text>
        {loading ? <ActivityIndicator color="#CBA6F7" /> : null}
        {!loading && !articles.length ? (
          <Text style={styles.publicNewsEmpty}>
            The news desk is warming up. Check back in a moment.
          </Text>
        ) : null}
        {articles.slice(0, 6).map((article, index) => (
          <Pressable
            key={article.id || article.url || index}
            accessibilityRole="link"
            accessibilityLabel={article.headline || 'Open article'}
            accessibilityHint="Open this article"
            style={styles.publicArticle}
            onPress={() => {
              if (article.url) void Linking.openURL(article.url)
            }}>
            {article.image ? (
              <Image
                accessibilityLabel={`${article.source || 'Article'} image`}
                source={{uri: article.image}}
                style={styles.publicArticleImage}
              />
            ) : null}
            <Text style={styles.publicArticleHeadline}>
              {article.headline || 'Untitled article'}
            </Text>
            <Text style={styles.meta}>
              {article.source || 'Unknown source'} ·{' '}
              {dateLabel(article.publishedAt)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#100F1A',
  },
  sidebar: {
    width: '32.1%',
    padding: 24,
    paddingHorizontal: 0,
    paddingRight: 80,
    borderRightWidth: 1,
    borderRightColor: '#2B293D',
    backgroundColor: '#100F1A',
  },
  sidebarNav: {width: 174, alignSelf: 'flex-end', gap: 4},
  sidebarNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  sidebarNavButtonActive: {
    backgroundColor: '#211F32',
    borderLeftColor: '#CBA6F7',
  },
  sidebarIcon: {width: 24, fontSize: 23, color: '#F7F3FA', textAlign: 'center'},
  sidebarNavLabel: {fontSize: 17, color: '#F7F3FA'},
  sidebarNavLabelActive: {fontWeight: '800', color: '#F7F3FA'},
  newPostButton: {
    marginTop: 24,
    width: 170,
    alignSelf: 'flex-end',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#CBA6F7',
    alignItems: 'center',
  },
  newPostButtonText: {fontSize: 16, fontWeight: '800', color: '#1E1E2E'},
  centerColumn: {
    width: '34.9%',
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#2B293D',
  },
  topTabs: {
    height: 110,
    flexDirection: 'row',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#2B293D',
  },
  topTabBrand: {
    position: 'absolute',
    top: 18,
    left: '50%',
    marginLeft: -13,
    zIndex: 1,
  },
  feedTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 42,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  feedTabActive: {borderBottomColor: '#CBA6F7'},
  feedTabText: {fontSize: 18, fontWeight: '700', color: '#A7A0B7'},
  feedTabTextActive: {color: '#F7F3FA'},
  rightRail: {
    width: '33%',
    flexGrow: 0,
    flexShrink: 1,
    padding: 20,
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: '#100F1A',
  },
  searchInput: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'flex-start',
    height: 52,
    color: '#F7F3FA',
    backgroundColor: '#211F32',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  railFeedMenu: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'flex-start',
    gap: 4,
  },
  railFeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  railFeedButtonActive: {backgroundColor: '#4B2B6E'},
  railFeedIcon: {
    fontSize: 18,
    color: '#F7F3FA',
    width: 24,
    textAlign: 'center',
  },
  railFeedLabel: {fontSize: 16, color: '#F7F3FA', fontWeight: '700'},
  signalCard: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'flex-start',
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D3953',
    borderRadius: 15,
    backgroundColor: '#151421',
  },
  signalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F7F3FA',
    marginBottom: 4,
  },
  signalItem: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#2B293D',
  },
  signalImage: {
    width: 74,
    height: 54,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  signalHeadline: {fontSize: 15, lineHeight: 20, color: '#C2BCCE'},
  signalMeta: {fontSize: 12, color: '#777287', marginTop: 6},
  voiceSignalCard: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'flex-start',
    padding: 18,
    borderWidth: 1,
    borderColor: '#3A3D3D',
    borderRadius: 15,
    backgroundColor: '#141616',
  },
  voiceSignalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceCount: {fontSize: 12, color: '#B9B3FF', fontWeight: '800'},
  voiceSignalHint: {
    color: '#8F928F',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    marginBottom: 12,
  },
  voicePreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  voicePreviewItem: {width: 66, alignItems: 'center', gap: 5},
  voicePreviewAvatar: {width: 42, height: 42, borderRadius: 13},
  voicePreviewName: {fontSize: 10, color: '#B9B5AA', maxWidth: 66},
  voiceDirectory: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 20,
    paddingBottom: 80,
    gap: 12,
  },
  voiceSearchBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3A3D3D',
    borderRadius: 14,
    backgroundColor: '#141616',
  },
  voiceSearchInput: {
    flex: 1,
    minHeight: 42,
    color: '#ECE6DA',
    backgroundColor: '#1C1F1F',
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  voiceDirectoryCount: {fontSize: 12, color: '#8F928F', fontWeight: '700'},
  voiceDirectoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  voiceDirectoryCard: {
    width: '48%',
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#303333',
    borderRadius: 13,
    backgroundColor: '#141616',
  },
  voiceDirectoryAvatar: {width: 54, height: 54, borderRadius: 16, backgroundColor: '#242827'},
  voiceDirectoryText: {flex: 1, minWidth: 0, gap: 2},
  voiceDirectoryName: {fontSize: 14, color: '#ECE6DA', fontWeight: '800'},
  voiceDirectoryHandle: {fontSize: 11, color: '#8F928F'},
  voiceDirectoryBio: {fontSize: 11, lineHeight: 15, color: '#B9B5AA'},
  voiceFollowButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#CBA6F7',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  voiceFollowButtonActive: {backgroundColor: '#35334A'},
  voiceFollowButtonText: {fontSize: 11, color: '#17141E', fontWeight: '800'},
  railFooter: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#777287',
    lineHeight: 18,
  },
  main: {
    flex: 1,
    maxWidth: '100%',
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 0,
  },
  brandHeader: {
    width: 174,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  wordmark: {
    fontSize: 29,
    fontWeight: '800',
    color: '#F7F3FA',
    letterSpacing: -0.5,
  },
  navButton: {
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 7,
  },
  navButtonActive: {backgroundColor: '#CBA6F7'},
  navLabel: {fontSize: 17, color: '#B8B3C7'},
  navLabelActive: {color: '#1E1E2E', fontWeight: '700'},
  sidebarSpacer: {flex: 1},
  handle: {
    width: 174,
    alignSelf: 'flex-end',
    color: '#FF9F43',
    fontWeight: '600',
    marginBottom: 16,
  },
  logout: {width: 174, alignSelf: 'flex-end', paddingVertical: 8},
  header: {
    paddingTop: 36,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#35334A',
  },
  headerTitle: {fontSize: 29, fontWeight: '800', color: '#F7F3FA'},
  headerSubtitle: {fontSize: 15, color: '#A7A0B7', marginTop: 5},
  feed: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 80,
    gap: 10,
  },
  feedIntro: {
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 4,
  },
  feedIntroTitle: {fontSize: 24, fontWeight: '800', color: '#F7F3FA'},
  feedIntroSubtitle: {fontSize: 14, color: '#A7A0B7'},
  article: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#3D3953',
    borderRadius: 14,
    backgroundColor: '#211F32',
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 176,
    marginBottom: 13,
    resizeMode: 'cover',
  },
  articleHeadline: {fontSize: 17, lineHeight: 23, color: '#F7F3FA'},
  meta: {fontSize: 13, color: '#8F8AA3'},
  articleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#35334A',
    paddingTop: 8,
    marginTop: 12,
  },
  verificationPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#35334A',
    gap: 10,
  },
  verificationHeader: {gap: 3},
  verificationTitle: {fontSize: 15, color: '#F7F3FA', fontWeight: '700'},
  verificationHint: {fontSize: 11, color: '#A7A0B7'},
  verificationRead: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#3D3953',
    borderRadius: 9,
    backgroundColor: '#181825',
    gap: 5,
  },
  verificationReadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationModel: {fontSize: 12, color: '#CBA6F7', fontWeight: '700'},
  verificationScore: {fontSize: 16, color: '#B9F6C9', fontWeight: '800'},
  verificationText: {fontSize: 13, lineHeight: 19, color: '#C2BCCE'},
  verificationSpread: {fontSize: 12, color: '#A7A0B7'},
  verificationDemo: {fontSize: 11, lineHeight: 16, color: '#8F8AA3'},
  loader: {padding: 30},
  error: {color: '#FF9F9F', paddingTop: 14},
  muted: {color: '#A7A0B7', fontSize: 14},
  composer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#3D3953',
    borderRadius: 14,
    backgroundColor: '#211F32',
    gap: 12,
  },
  composerInput: {
    minHeight: 72,
    color: '#F7F3FA',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#CBA6F7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {color: '#1E1E2E', fontWeight: '800'},
  secondaryButton: {
    backgroundColor: '#35334A',
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {color: '#F7F3FA', fontWeight: '700'},
  followBox: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#3D3953',
    borderRadius: 14,
    gap: 10,
  },
  sectionTitle: {fontSize: 17, color: '#F7F3FA', fontWeight: '700'},
  followRow: {flexDirection: 'row', gap: 10},
  followInput: {
    flex: 1,
    color: '#F7F3FA',
    backgroundColor: '#181825',
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  message: {color: '#B9F6C9'},
  localLoginBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#303333',
    gap: 8,
  },
  localLoginTitle: {fontSize: 13, color: '#ECE6DA', fontWeight: '800'},
  localLoginHint: {fontSize: 12, lineHeight: 17, color: '#8F928F'},
  post: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D3953',
    borderRadius: 14,
    backgroundColor: '#211F32',
    gap: 8,
  },
  postAuthor: {color: '#FF9F43', fontWeight: '700'},
  postBody: {color: '#F7F3FA', fontSize: 16, lineHeight: 23},
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#35334A',
    paddingTop: 8,
    marginTop: 4,
  },
  postAction: {
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 9,
  },
  postActionActive: {backgroundColor: '#3A2853'},
  postActionIcon: {fontSize: 18, color: '#CBA6F7'},
  postActionLabel: {fontSize: 13, color: '#A7A0B7'},
  commentBox: {
    marginTop: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3A3D3D',
    borderRadius: 14,
    backgroundColor: '#141616',
  },
  commentThread: {
    gap: 4,
  },
  commentThreadHeader: {
    gap: 2,
    paddingBottom: 6,
  },
  commentThreadTitle: {fontSize: 14, color: '#ECE6DA', fontWeight: '800'},
  commentThreadHint: {fontSize: 12, color: '#8F928F'},
  commentEmpty: {fontSize: 13, lineHeight: 19, color: '#A9AAA3'},
  commentThreadChild: {
    marginTop: 8,
    paddingLeft: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1B1E1E',
  },
  commentThreadItem: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#303333',
  },
  commentThreadRail: {
    position: 'absolute',
    left: 13,
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 2,
    backgroundColor: '#454A47',
  },
  comment: {flex: 1, minWidth: 0},
  commentIdentityRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 9},
  commentAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242827',
    borderWidth: 1,
    borderColor: '#777B76',
  },
  commentAvatarText: {fontSize: 11, color: '#D6D0C4', fontWeight: '800'},
  commentContent: {flex: 1, minWidth: 0, gap: 4},
  commentHeader: {flexDirection: 'row', alignItems: 'center', gap: 6},
  commentAuthor: {fontSize: 13, color: '#B9B5AA', fontWeight: '800'},
  commentTime: {fontSize: 11, color: '#858985'},
  commentBody: {fontSize: 15, lineHeight: 22, color: '#DFDAD0'},
  commentReplyButton: {
    alignSelf: 'flex-start',
    marginTop: 1,
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  commentReplyText: {fontSize: 12, color: '#B7A6D0', fontWeight: '800'},
  replyTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#242827',
  },
  replyTargetText: {fontSize: 12, color: '#C5C0B5', fontWeight: '700'},
  commentComposer: {
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#303333',
  },
  commentComposerRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  commentInput: {
    flex: 1,
    minHeight: 42,
    color: '#F7F3FA',
    backgroundColor: '#11101A',
    borderWidth: 1,
    borderColor: '#3A3150',
    borderRadius: 11,
    paddingHorizontal: 12,
  },
  commentButton: {
    backgroundColor: '#CBA6F7',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  commentButtonText: {fontSize: 13, color: '#1D1728', fontWeight: '800'},
  profileFeed: {paddingTop: 0},
  profileCover: {
    width: '100%',
    height: 190,
    overflow: 'hidden',
    backgroundColor: '#17152A',
  },
  profileCoverImage: {width: '100%', height: '100%', resizeMode: 'cover'},
  profileCoverFallback: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#17152A',
  },
  coverOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.7,
  },
  coverOrbOne: {
    width: 250,
    height: 250,
    top: -100,
    right: -50,
    backgroundColor: '#543A88',
  },
  coverOrbTwo: {
    width: 180,
    height: 180,
    bottom: -90,
    left: 18,
    backgroundColor: '#1E7D8D',
  },
  coverOrbThree: {
    width: 90,
    height: 90,
    top: 34,
    left: '44%',
    backgroundColor: '#FF9F1C',
    opacity: 0.55,
  },
  coverGridLineOne: {
    position: 'absolute',
    left: -20,
    right: -20,
    top: 76,
    height: 1,
    backgroundColor: '#B7A4FF',
    opacity: 0.35,
    transform: [{rotate: '-10deg'}],
  },
  coverGridLineTwo: {
    position: 'absolute',
    left: -20,
    right: -20,
    top: 132,
    height: 1,
    backgroundColor: '#8BE9FD',
    opacity: 0.3,
    transform: [{rotate: '8deg'}],
  },
  coverGridLineThree: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    left: '68%',
    width: 1,
    backgroundColor: '#F7F3FA',
    opacity: 0.24,
    transform: [{rotate: '24deg'}],
  },
  coverLabel: {
    position: 'absolute',
    left: 22,
    bottom: 32,
    color: '#F7F3FA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  coverSubLabel: {
    position: 'absolute',
    left: 22,
    bottom: 14,
    color: '#D9D0ED',
    fontSize: 11,
  },
  profileIdentityRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  profileAvatarRing: {
    width: 88,
    height: 88,
    marginTop: -44,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#100F1A',
    backgroundColor: '#211F32',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {width: '100%', height: '100%', resizeMode: 'cover'},
  profileActionButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#A7A0B7',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  profileActionButtonText: {color: '#F7F3FA', fontWeight: '800'},
  profileHero: {
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#35334A',
    gap: 5,
  },
  profileDisplayName: {fontSize: 24, color: '#FF9F43', fontWeight: '800'},
  profileHandle: {fontSize: 15, color: '#FF9F43'},
  profileBio: {fontSize: 15, lineHeight: 21, color: '#D4CFDC', marginTop: 6},
  profileStats: {fontSize: 13, color: '#A7A0B7', marginTop: 5},
  profileTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#35334A',
  },
  profileTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  profileTabActive: {borderBottomColor: '#CBA6F7'},
  profileTabText: {fontSize: 13, color: '#A7A0B7', fontWeight: '700'},
  profileTabTextActive: {color: '#F7F3FA'},
  profileEditor: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#3D3953',
    borderRadius: 14,
    backgroundColor: '#211F32',
    gap: 10,
  },
  profileInput: {
    minHeight: 44,
    color: '#F7F3FA',
    backgroundColor: '#181825',
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  profileBioInput: {minHeight: 76, paddingTop: 11, textAlignVertical: 'top'},
  profilePostsTitle: {fontSize: 18, color: '#F7F3FA', fontWeight: '800'},
  empty: {color: '#A7A0B7', padding: 20, textAlign: 'center'},
  authOuter: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  authPage: {
    flexGrow: 1,
    backgroundColor: '#1E1E2E',
    alignItems: 'center',
    padding: 24,
    gap: 18,
  },
  authCard: {
    width: '100%',
    maxWidth: 430,
    padding: 32,
    borderRadius: 18,
    backgroundColor: '#211F32',
    borderWidth: 1,
    borderColor: '#3D3953',
    gap: 14,
  },
  authEyebrow: {fontSize: 14, color: '#A7A0B7', marginTop: -8},
  authSubtitle: {
    fontSize: 16,
    color: '#A7A0B7',
    lineHeight: 23,
    marginBottom: 10,
  },
  publicNews: {width: '100%', maxWidth: 760, gap: 10, paddingBottom: 32},
  publicNewsTitle: {fontSize: 24, fontWeight: '800', color: '#F7F3FA'},
  publicNewsIntro: {
    fontSize: 14,
    color: '#A7A0B7',
    lineHeight: 21,
    marginBottom: 4,
  },
  publicNewsEmpty: {color: '#A7A0B7', paddingVertical: 18, textAlign: 'center'},
  publicArticle: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#3D3953',
    borderRadius: 14,
    backgroundColor: '#211F32',
    overflow: 'hidden',
  },
  publicArticleImage: {
    width: '100%',
    height: 170,
    marginBottom: 14,
    resizeMode: 'cover',
  },
  publicArticleHeadline: {fontSize: 17, lineHeight: 24, color: '#F7F3FA'},
  input: {
    height: 48,
    color: '#F7F3FA',
    backgroundColor: '#181825',
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  switchText: {color: '#CBA6F7', textAlign: 'center', paddingTop: 6},
})
