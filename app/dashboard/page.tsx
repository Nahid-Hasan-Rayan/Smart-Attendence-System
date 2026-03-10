import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardContent from './DashboardContent' // client component

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/register')
  }

  // No organization → show prompt (server‑rendered, no mode needed)
  if (!profile.organization_id) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Welcome, {user.email}!</h1>
          <p className="text-gray-600 mb-6">
            You are not part of any organization yet. Create a new organization or join an existing one.
          </p>
          <div className="space-x-4">
            <Link
              href="/org/create"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Create Organization
            </Link>
            <Link
              href="/org/join"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
            >
              Join Organization
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch organization details (including mode)
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('name, join_code, mode')
    .eq('id', profile.organization_id)
    .single()

  if (orgError || !organization) {
    // Fallback – should not happen
    return <div>Error loading organization</div>
  }

  // Fetch sessions for this organization
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('start_time', { ascending: false })

  if (sessionsError) {
    // Handle error appropriately
    console.error('Error fetching sessions:', sessionsError)
  }

  // Pass all fetched data to the client component
  return (
    <DashboardContent
      profile={profile}
      organization={organization}
      sessions={sessions || []}
      userEmail={user.email ?? ''}
    />
  )
}