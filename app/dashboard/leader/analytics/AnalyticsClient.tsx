'use client'

import { useEffect, useState, useCallback } from 'react'
import { useMode } from '@/contexts/ModeContext'
import AdvancedFilter from '@/components/AdvancedFilter'
import EmailComposer from '@/components/EmailComposer' // <-- new import
import type { MemberStats, FilterOptions } from '@/lib/analytics'

interface AnalyticsClientProps {
  orgId: string
  organizationName: string // <-- new prop
}

export default function AnalyticsClient({ orgId, organizationName }: AnalyticsClientProps) {
  const [ranking, setRanking] = useState<MemberStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({})
  const { terminology, primaryColor } = useMode()

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ orgId })
      if (filters.dateRange?.start && filters.dateRange?.end) {
        params.append('startDate', filters.dateRange.start.toISOString())
        params.append('endDate', filters.dateRange.end.toISOString())
      }
      if (filters.minPercentage !== undefined) {
        params.append('minPercentage', filters.minPercentage.toString())
      }
      if (filters.maxPercentage !== undefined) {
        params.append('maxPercentage', filters.maxPercentage.toString())
      }
      if (filters.statuses && filters.statuses.length > 0) {
        params.append('statuses', filters.statuses.join(','))
      }

      const res = await fetch(`/api/analytics/ranking?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch')
      }
      const data = await res.json()
      setRanking(data)
    } catch (err: any) {
      setError(err.message || 'Could not load analytics')
    } finally {
      setLoading(false)
    }
  }, [orgId, filters])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  const getTrendDisplay = (trend: number) => {
    if (trend > 0) {
      return { text: `+${trend}%`, color: 'text-green-600', icon: '↑' }
    } else if (trend < 0) {
      return { text: `${trend}%`, color: 'text-red-600', icon: '↓' }
    } else {
      return { text: '0%', color: 'text-gray-500', icon: '→' }
    }
  }

  return (
    <div className="p-8">
      {/* Header with title and email button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
          {terminology.leader} Analytics
        </h1>
        <EmailComposer
          organizationId={orgId}
          organizationName={organizationName}
        />
      </div>

      <AdvancedFilter onFilterChange={setFilters} />

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && ranking.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-600">
          No members match the selected filters.
        </div>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present / Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend (7d)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ranking.map((member) => {
                const trend = getTrendDisplay(member.trend)
                return (
                  <tr key={member.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{member.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {member.attendancePercentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.presentSessions} / {member.totalSessions}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${trend.color}`}>
                      {trend.icon} {trend.text}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}