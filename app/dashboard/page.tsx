import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/register')

  // No organization → show prompt
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

  // Fetch organization details
  const { data: organization } = await supabase
    .from('organizations')
    .select('name, join_code')
    .eq('id', profile.organization_id)
    .single()

  // Fetch sessions for this organization
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('start_time', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {profile.role === 'leader' && (
            <Link
              href="/dashboard/create-session"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + New Session
            </Link>
          )}
        </div>

        <p className="text-gray-600 mb-6">
          You are a <span className="font-semibold">{profile.role}</span> of{' '}
          <span className="font-semibold">{organization?.name}</span>.
        </p>

        {profile.role === 'leader' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Organization Join Code</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-2xl font-mono">{organization?.join_code}</p>
              <p className="text-sm text-gray-500 mt-1">
                Share this code with members who want to join.
              </p>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">Sessions</h2>
        {!sessions || sessions.length === 0 ? (
          <p className="text-gray-600">No sessions yet.</p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((session) => (
              <li key={session.id} className="bg-white p-4 rounded-lg shadow">
                <Link href={`/dashboard/session/${session.id}`}>
                  <h3 className="text-xl font-semibold text-blue-600 hover:underline">
                    {session.title}
                  </h3>
                </Link>
                <p className="text-gray-600">
                  {new Date(session.start_time).toLocaleDateString()} at{' '}
                  {new Date(session.start_time).toLocaleTimeString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}