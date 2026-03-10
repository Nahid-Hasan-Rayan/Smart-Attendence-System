import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import QRCodeDisplay from '@/components/QRCodeDisplay'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.organization_id) redirect('/dashboard')

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !session || session.organization_id !== profile.organization_id) {
    notFound()
  }

  // Fetch attendance with profiles (only if leader)
  let attendance = null
  if (profile.role === 'leader') {
    const { data } = await supabase
      .from('attendance')
      .select(`
        user_id,
        checked_in_at,
        profiles ( name )
      `)
      .eq('session_id', session.id)
      .order('checked_in_at', { ascending: true })
    attendance = data
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
        <p className="text-gray-600 mb-6">
          {new Date(session.start_time).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          })} at {new Date(session.start_time).toLocaleTimeString()}
        </p>

        {profile.role === 'leader' && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">QR Code</h2>
            <QRCodeDisplay sessionId={id} />
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Attendance</h2>
          {profile.role === 'leader' ? (
            !attendance || attendance.length === 0 ? (
              <p className="text-gray-600">No attendance recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Checked In At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.map((record: any) => (
                      <tr key={record.user_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.profiles.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.checked_in_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <p className="text-gray-600">
              Your attendance will be recorded when you scan the QR code during the session.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}