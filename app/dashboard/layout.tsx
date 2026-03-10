import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  // If no organization, redirect to create/join page
  if (!profile?.organization_id) {
    redirect('/org/create') // or you could show a prompt; adjust as needed
  }

  // Fetch organization mode
  const { data: org } = await supabase
    .from('organizations')
    .select('mode')
    .eq('id', profile.organization_id)
    .single()

  const initialMode = org?.mode || 'education'

  return (
    <DashboardLayoutClient initialMode={initialMode}>
      {children}
    </DashboardLayoutClient>
  )
}