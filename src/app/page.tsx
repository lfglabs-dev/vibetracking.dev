import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { LeaderboardWithTimeframe } from '@/components/leaderboard/LeaderboardWithTimeframe'
import { CTABox } from '@/components/home/CTABox'
import { HomeStickers } from '@/components/home/HomeStickers'
import { Logo } from '@/components/shared/Logo'
import Link from 'next/link'

interface UserData {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface LeaderboardRow {
  user_id: string
  total_tokens: number
  total_sessions: number
  total_cost: number
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
  teamSlug: string | null
  teamName: string | null
  teamIsPublic: boolean
  totalTokens: number
  totalSessions: number
  currentStreak: number
  favoriteModel: string | null
  estimatedSpend: number
  profileUrl: string
}

type LeaderboardSeed = LeaderboardEntry

// Mock data for testing the leaderboard UI
const MOCK_LEADERBOARD: LeaderboardSeed[] = [
  {
    rank: 1,
    userId: '1',
    username: 'sarah_codes',
    displayName: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    teamSlug: null,
    teamName: null,
    teamIsPublic: false,
    totalTokens: 45_892_341,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 1247,
    currentStreak: 42,
    estimatedSpend: 2850,
    profileUrl: '/@sarah_codes',
  },
  {
    rank: 2,
    userId: '2',
    username: 'alex_dev',
    displayName: 'Alex Rivera',
    avatarUrl: 'https://i.pravatar.cc/150?u=alex',
    teamSlug: null,
    teamName: null,
    teamIsPublic: false,
    totalTokens: 38_127_892,
    favoriteModel: 'claude-opus-4-20250514',
    totalSessions: 982,
    currentStreak: 28,
    estimatedSpend: 2340,
    profileUrl: '/@alex_dev',
  },
  {
    rank: 3,
    userId: '3',
    username: 'maya_builds',
    displayName: 'Maya Johnson',
    avatarUrl: 'https://i.pravatar.cc/150?u=maya',
    teamSlug: null,
    teamName: null,
    teamIsPublic: false,
    totalTokens: 29_451_203,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 756,
    currentStreak: 35,
    estimatedSpend: 1890,
    profileUrl: '/@maya_builds',
  },
  {
    rank: 4,
    userId: '4',
    username: 'kevin_hacks',
    displayName: 'Kevin Park',
    avatarUrl: 'https://i.pravatar.cc/150?u=kevin',
    teamSlug: null,
    teamName: null,
    teamIsPublic: false,
    totalTokens: 24_892_451,
    favoriteModel: 'gpt-4o',
    totalSessions: 621,
    currentStreak: 21,
    estimatedSpend: 1560,
    profileUrl: '/@kevin_hacks',
  },
  {
    rank: 5,
    userId: '5',
    username: 'emma_codes',
    displayName: 'Emma Wilson',
    avatarUrl: 'https://i.pravatar.cc/150?u=emma',
    teamSlug: null,
    teamName: null,
    teamIsPublic: false,
    totalTokens: 21_347_892,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 543,
    currentStreak: 19,
    estimatedSpend: 1280,
    profileUrl: '/@emma_codes',
  },
  {
    rank: 6,
    userId: '6',
    username: 'james_dev',
    displayName: 'James Thompson',
    avatarUrl: 'https://i.pravatar.cc/150?u=james',
    teamSlug: null,
    teamName: null,
    teamIsPublic: false,
    totalTokens: 18_923_451,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 489,
    currentStreak: 12,
    estimatedSpend: 1120,
    profileUrl: '/@james_dev',
  },
  {
    rank: 7,
    userId: '7',
    username: 'lisa_builds',
    displayName: 'Lisa Wang',
    avatarUrl: 'https://i.pravatar.cc/150?u=lisa',
    teamSlug: null,
    teamName: null,
    teamIsPublic: false,
    totalTokens: 15_782_341,
    favoriteModel: 'claude-sonnet-4-20250514',
    totalSessions: 412,
    currentStreak: 7,
    estimatedSpend: 890,
    profileUrl: '/@lisa_builds',
  },
  {
    rank: 8,
    userId: '8',
    username: 'mike_codes',
    displayName: 'Mike Brown',
    avatarUrl: 'https://i.pravatar.cc/150?u=mike',
    teamSlug: null,
    teamName: null,
    teamIsPublic: false,
    totalTokens: 12_451_892,
    favoriteModel: 'claude-opus-4-20250514',
    totalSessions: 356,
    currentStreak: 5,
    estimatedSpend: 720,
    profileUrl: '/@mike_codes',
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

  // Use service role for team data to bypass RLS
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch leaderboard
  const { data: leaderboard } = await supabase
    .from('user_stats')
    .select(
      `
      user_id,
      total_tokens,
      total_sessions,
      total_cost,
      current_streak_days,
      favorite_model,
      users!inner (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .order('total_cost', { ascending: false })
    .limit(50)

  // Get all user IDs to fetch their team memberships
  const userIds = (leaderboard as unknown as LeaderboardRow[])
    ?.map((entry) => {
      const userData = Array.isArray(entry.users) ? entry.users[0] : entry.users
      return userData?.id
    })
    .filter((id): id is string => id !== undefined) || []

  // Fetch team memberships for all users (use service role to bypass RLS)
  const { data: memberships } = await serviceSupabase
    .from('team_memberships')
    .select(`
      user_id,
      joined_at,
      teams (
        github_org_login,
        name,
        is_public
      )
    `)
    .in('user_id', userIds)
    .order('joined_at', { ascending: true })

  // Create a map of user_id to team info (first team joined takes priority)
  const userTeamMap = new Map<string, { slug: string; name: string; isPublic: boolean }>()
  if (memberships) {
    for (const m of memberships) {
      if (m.user_id && m.teams) {
        // Skip if we already have a team for this user (keep the first one joined)
        if (userTeamMap.has(m.user_id)) continue

        const team = Array.isArray(m.teams) ? m.teams[0] : m.teams
        if (team) {
          userTeamMap.set(m.user_id, {
            slug: (team as { github_org_login: string }).github_org_login,
            name: (team as { name: string }).name,
            isPublic: (team as { is_public: boolean }).is_public ?? false,
          })
        }
      }
    }
  }

  // Transform leaderboard data - use total_cost directly from database
  const dbEntries: LeaderboardEntry[] =
    (leaderboard as unknown as LeaderboardRow[])?.map((entry, index) => {
      // Supabase !inner join returns a single object, not an array
      const userData = Array.isArray(entry.users) ? entry.users[0] : entry.users
      if (!userData) return null

      const teamInfo = userTeamMap.get(userData.id)

      return {
        rank: index + 1,
        userId: userData.id,
        username: userData.username,
        displayName: userData.display_name,
        avatarUrl: userData.avatar_url,
        teamSlug: teamInfo?.slug || null,
        teamName: teamInfo?.name || null,
        teamIsPublic: teamInfo?.isPublic || false,
        totalTokens: entry.total_tokens,
        totalSessions: entry.total_sessions,
        currentStreak: entry.current_streak_days,
        favoriteModel: entry.favorite_model,
        estimatedSpend: entry.total_cost,
        profileUrl: `/@${userData.username}`,
      }
    }).filter((entry): entry is LeaderboardEntry => entry !== null) || []

  // Use mock data if no real data exists, already sorted by estimatedSpend (total_cost)
  const entries: LeaderboardEntry[] =
    dbEntries.length > 0 ? dbEntries : MOCK_LEADERBOARD

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
            <LeaderboardWithTimeframe
              initialEntries={entries}
              currentUserId={user?.id}
              currentUsername={user?.user_metadata?.user_name}
            />
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-[#232323]/50">
            <p>
              Track your AI coding vibes across 7 tools
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
