// lib/analytics.ts
import { SupabaseClient } from '@supabase/supabase-js'

export interface MemberStats {
  user_id: string
  name: string
  email: string
  totalSessions: number
  presentSessions: number
  attendancePercentage: number
  trend: number // percentage point change (last 7 days vs previous 7 days)
  rank: number
}

export interface FilterOptions {
  dateRange?: { start: Date; end: Date }
  minPercentage?: number
  maxPercentage?: number
  statuses?: string[] // e.g., ['present', 'late']
}

/**
 * Compute attendance statistics for all members of an organization,
 * applying optional filters.
 */
export async function getRankedMembers(
  orgId: string,
  supabase: SupabaseClient,
  filters: FilterOptions = {}
): Promise<MemberStats[]> {
  // Fetch all members with their attendance and session details
  const { data: members, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      attendance (
        status,
        checked_in_at,
        session:session_id!inner (
          start_time
        )
      )
    `)
    .eq('organization_id', orgId)
    .eq('role', 'member')

  if (error) {
    console.error('Error fetching members:', error)
    throw new Error(`Failed to fetch members: ${error.message}`)
  }

  // Pre-calculate trend periods (always based on full history, independent of filters)
  const now = new Date()
  const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const stats = members.map((member: any) => {
    const attendance = member.attendance || []

    // Apply filters to attendance records for overall stats
    let filteredAttendance = attendance

    // Filter by date range
    if (filters.dateRange) {
      filteredAttendance = filteredAttendance.filter((a: any) => {
        const sessionDate = new Date(a.session.start_time)
        return sessionDate >= filters.dateRange!.start && sessionDate <= filters.dateRange!.end
      })
    }

    // Filter by statuses
    if (filters.statuses && filters.statuses.length > 0) {
      filteredAttendance = filteredAttendance.filter((a: any) =>
        filters.statuses!.includes(a.status)
      )
    }

    // Overall stats (after filters)
    const totalSessions = filteredAttendance.length
    const presentSessions = filteredAttendance.filter(
      (a: any) => a.status === 'present'
    ).length
    const percentage = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0

    // Trend (unfiltered – we keep trend independent of filters for consistency)
    const recent = attendance.filter((a: any) => {
      const d = new Date(a.session.start_time)
      return d >= lastWeekStart && d <= now
    })
    const recentPresent = recent.filter((a: any) => a.status === 'present').length
    const recentPct = recent.length > 0 ? (recentPresent / recent.length) * 100 : 0

    const previous = attendance.filter((a: any) => {
      const d = new Date(a.session.start_time)
      return d >= twoWeeksAgo && d < lastWeekStart
    })
    const previousPresent = previous.filter((a: any) => a.status === 'present').length
    const previousPct = previous.length > 0 ? (previousPresent / previous.length) * 100 : 0

    const trend = recentPct - previousPct

    return {
      user_id: member.id,
      name: member.name,
      email: member.email || '',
      totalSessions,
      presentSessions,
      attendancePercentage: Math.round(percentage * 10) / 10,
      trend: Math.round(trend * 10) / 10,
    }
  })

  // Apply percentage range filters
  let filteredStats = stats
  if (filters.minPercentage !== undefined) {
    filteredStats = filteredStats.filter(
      (s) => s.attendancePercentage >= filters.minPercentage!
    )
  }
  if (filters.maxPercentage !== undefined) {
    filteredStats = filteredStats.filter(
      (s) => s.attendancePercentage <= filters.maxPercentage!
    )
  }

  // Sort and rank
  filteredStats.sort((a, b) => {
    if (b.attendancePercentage !== a.attendancePercentage) {
      return b.attendancePercentage - a.attendancePercentage
    }
    if (b.presentSessions !== a.presentSessions) {
      return b.presentSessions - a.presentSessions
    }
    return a.name.localeCompare(b.name)
  })

  return filteredStats.map((member, index) => ({ ...member, rank: index + 1 }))
}