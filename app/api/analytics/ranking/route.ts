// app/api/analytics/ranking/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getRankedMembers, FilterOptions } from '@/lib/analytics'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const minPercentage = searchParams.get('minPercentage')
  const maxPercentage = searchParams.get('maxPercentage')
  const statusesParam = searchParams.get('statuses') // comma-separated, e.g. "present,late"

  if (!orgId) {
    return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the user is a leader of this organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Build filters object
  const filters: FilterOptions = {}

  if (startDate && endDate) {
    filters.dateRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    }
  }

  if (minPercentage) {
    filters.minPercentage = parseFloat(minPercentage)
  }
  if (maxPercentage) {
    filters.maxPercentage = parseFloat(maxPercentage)
  }
  if (statusesParam) {
    filters.statuses = statusesParam.split(',')
  }

  try {
    const ranking = await getRankedMembers(orgId, supabase, filters)
    return NextResponse.json(ranking)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}