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

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.organization_id) {
    redirect('/dashboard')
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !session) {
    notFound()
  }

  if (session.organization_id !== profile.organization_id) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
        <p className="text-gray-600 mb-6">
          {new Date(session.start_time).toLocaleDateString()} at{' '}
          {new Date(session.start_time).toLocaleTimeString()}
        </p>

        {profile.role === 'leader' && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">QR Code</h2>
            <QRCodeDisplay sessionId={id} />
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Attendance</h2>
          <p className="text-gray-600">
            Attendance tracking will be added in Part 6.
          </p>
        </div>
      </div>
    </div>
  )
}