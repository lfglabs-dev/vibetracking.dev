import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { CTABox } from '@/components/home/CTABox'
import { HomeStickers } from '@/components/home/HomeStickers'
import { estimateApiSpendUsd } from '@/lib/pricing'
import { Logo } from '@/components/shared/Logo'
import Link from 'next/link'

interface UserData {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  company: string | null
  is_anonymous: boolean
  anonymous_id: string | null
}

interface LeaderboardRow {
  user_id: string
  total_tokens: number
  total_sessions: number
  current_streak_days: number
  favorite_model: string | null
  users: UserData[]
}

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  company: string | null
  isAnonymous: boolean
  totalTokens: number
  totalSessions: number
  currentStreak: number
  favoriteModel: string | null
  estimatedSpend: number
  profileUrl: string
}

type LeaderboardSeed = Omit<LeaderboardEntry, 'estimatedSpend'>

// Mock data for testing the leaderboard UI
const MOCK_LEADERBOARD: LeaderboardSeed[] = [
  {
    rank: 1,
    userId: '1',
    username: 'sarah_codes',
    displayName: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    company: 'Anthropic',
    isAnonymous: false,
    totalTokens: 45_892_341,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 1247,
    currentStreak: 42,
    profileUrl: '/sarah_codes',
  },
  {
    rank: 2,
    userId: '2',
    username: 'alex_dev',
    displayName: 'Alex Rivera',
    avatarUrl: 'https://i.pravatar.cc/150?u=alex',
    company: 'Vercel',
    isAnonymous: false,
    totalTokens: 38_127_892,
    favoriteModel: 'claude-opus-4-20250514',
    totalSessions: 982,
    currentStreak: 28,
    profileUrl: '/alex_dev',
  },
  {
    rank: 3,
    userId: '3',
    username: 'maya_builds',
    displayName: 'Maya Johnson',
    avatarUrl: 'https://i.pravatar.cc/150?u=maya',
    company: 'Supabase',
    isAnonymous: false,
    totalTokens: 29_451_203,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 756,
    currentStreak: 35,
    profileUrl: '/maya_builds',
  },
  {
    rank: 4,
    userId: '4',
    username: 'anon_abc123',
    displayName: null,
    avatarUrl: null,
    company: null,
    isAnonymous: true,
    totalTokens: 24_892_451,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 621,
    currentStreak: 14,
    profileUrl: '/u/abc123',
  },
  {
    rank: 5,
    userId: '5',
    username: 'kevin_hacks',
    displayName: 'Kevin Park',
    avatarUrl: 'https://i.pravatar.cc/150?u=kevin',
    company: 'OpenAI',
    isAnonymous: false,
    totalTokens: 21_347_892,
    favoriteModel: 'gpt-4o',
    totalSessions: 543,
    currentStreak: 21,
    profileUrl: '/kevin_hacks',
  },
  {
    rank: 6,
    userId: '6',
    username: 'emma_codes',
    displayName: 'Emma Wilson',
    avatarUrl: 'https://i.pravatar.cc/150?u=emma',
    company: 'Stripe',
    isAnonymous: false,
    totalTokens: 18_923_451,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 489,
    currentStreak: 19,
    profileUrl: '/emma_codes',
  },
  {
    rank: 7,
    userId: '7',
    username: 'anon_xyz789',
    displayName: 'Cursor Lover',
    avatarUrl: null,
    company: null,
    isAnonymous: true,
    totalTokens: 15_782_341,
    favoriteModel: 'claude-haiku-3-5-20241022',
    totalSessions: 412,
    currentStreak: 8,
    profileUrl: '/u/xyz789',
  },
  {
    rank: 8,
    userId: '8',
    username: 'james_dev',
    displayName: 'James Thompson',
    avatarUrl: 'https://i.pravatar.cc/150?u=james',
    company: 'Linear',
    isAnonymous: false,
    totalTokens: 12_451_892,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 356,
    currentStreak: 12,
    profileUrl: '/james_dev',
  },
  {
    rank: 9,
    userId: '9',
    username: 'lisa_builds',
    displayName: 'Lisa Wang',
    avatarUrl: 'https://i.pravatar.cc/150?u=lisa',
    company: 'Figma',
    isAnonymous: false,
    totalTokens: 9_823_451,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 287,
    currentStreak: 7,
    profileUrl: '/lisa_builds',
  },
  {
    rank: 10,
    userId: '10',
    username: 'mike_codes',
    displayName: 'Mike Brown',
    avatarUrl: 'https://i.pravatar.cc/150?u=mike',
    company: 'Notion',
    isAnonymous: false,
    totalTokens: 7_451_234,
    favoriteModel: 'claude-opus-4-20250514',
    totalSessions: 198,
    currentStreak: 5,
    profileUrl: '/mike_codes',
  },
]

export default async function Home() {
  const authSupabase = await createServerClient()

  // Check if user is logged in
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  // Use direct client for data fetch
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch leaderboard
  const { data: leaderboard } = await supabase
    .from('user_stats')
    .select(
      `
      user_id,
      total_tokens,
      total_sessions,
      current_streak_days,
      favorite_model,
      users!inner (
        id,
        username,
        display_name,
        avatar_url,
        company,
        is_anonymous,
        anonymous_id
      )
    `
    )
    .order('total_tokens', { ascending: false })
    .limit(50)

  // Transform leaderboard data
  const dbEntries: LeaderboardSeed[] =
    (leaderboard as unknown as LeaderboardRow[])?.map((entry, index) => {
      // Supabase !inner join returns a single object, not an array
      const userData = Array.isArray(entry.users) ? entry.users[0] : entry.users
      if (!userData) return null

      return {
        rank: index + 1,
        userId: userData.id,
        username: userData.username,
        displayName: userData.display_name,
        avatarUrl: userData.avatar_url,
        company: userData.company,
        isAnonymous: userData.is_anonymous,
        totalTokens: entry.total_tokens,
        totalSessions: entry.total_sessions,
        currentStreak: entry.current_streak_days,
        favoriteModel: entry.favorite_model,
        profileUrl: userData.is_anonymous
          ? `/u/${userData.anonymous_id}`
          : `/@${userData.username}`,
      }
    }).filter((entry): entry is LeaderboardSeed => entry !== null) || []

  // Use mock data if no real data exists
  const rawEntries: LeaderboardSeed[] =
    dbEntries.length > 0 ? dbEntries : MOCK_LEADERBOARD

  const entries: LeaderboardEntry[] = rawEntries
    .map((entry) => ({
      ...entry,
      estimatedSpend: estimateApiSpendUsd({
        model: entry.favoriteModel,
        totalTokens: entry.totalTokens,
      }),
    }))
    .sort((a, b) => b.estimatedSpend - a.estimatedSpend)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto relative">
        <HomeStickers leaderboardCount={entries.length} />
        <div className="relative z-10">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <Logo />

            {user ? (
              <Link href={`/@${user.user_metadata?.user_name || user.id}`}>
                <button className="btn-secondary flex items-center gap-2">
                  <span>My Profile</span>
                </button>
              </Link>
            ) : null}
          </header>

          {/* Main content - Leaderboard + CTA */}
          <div className="space-y-8">
            {/* CTA Box */}
            <CTABox />

            {/* Leaderboard */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Leaderboard</h2>
                <span className="tag tag-yellow">All Time</span>
              </div>

              <LeaderboardTable entries={entries} currentUserId={user?.id} />
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-[#232323]/50">
            <p>
              Track your AI coding vibes with Claude Code, Codex, and Cursor
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
