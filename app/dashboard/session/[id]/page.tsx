import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import SessionContent from './SessionContent'

// Define the type for attendance records to match SessionContent's expectation
interface AttendanceRecord {
  user_id: string
  checked_in_at: string
  device_fingerprint?: string
  profiles: { name: string }
}

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

  // Fetch initial attendance with profiles
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select(`
      user_id,
      checked_in_at,
      device_fingerprint,
      profiles ( name )
    `)
    .eq('session_id', session.id)
    .order('checked_in_at', { ascending: true })

  if (attendanceError) {
    console.error('Error fetching attendance:', attendanceError)
  }

  // Safely transform the data to match AttendanceRecord interface
  const initialAttendance: AttendanceRecord[] = (attendance || []).map((record: any) => ({
    user_id: record.user_id,
    checked_in_at: record.checked_in_at,
    device_fingerprint: record.device_fingerprint,
    profiles: { name: record.profiles?.name || 'Unknown' }
  }))

  return (
    <SessionContent
      session={session}
      initialAttendance={initialAttendance}
      userRole={profile.role}
      userId={user.id}
    />
  )
}