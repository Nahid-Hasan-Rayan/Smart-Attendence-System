import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'leader') {
    redirect('/dashboard')
  }

  if (!profile.organization_id) {
    redirect('/dashboard')
  }

  // Fetch organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.organization_id)
    .single()

  const organizationName = org?.name || 'Your Organization'

  return (
    <AnalyticsClient
      orgId={profile.organization_id}
      organizationName={organizationName}
    />
  )
}