'use server'

import { createClient } from '@/lib/supabase/server'

export async function markAttendance(formData: FormData) {
  const sessionId = formData.get('sessionId') as string
  const token = formData.get('token') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Fetch the session to verify token and expiry
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return { error: 'Session not found' }
  }

  // Verify token
  if (session.qr_token !== token) {
    return { error: 'Invalid QR code' }
  }

  // Verify token hasn't expired
  const now = new Date()
  const expires = new Date(session.qr_expires)
  if (now > expires) {
    return { error: 'QR code has expired' }
  }

  // Check if user is in the same organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.organization_id !== session.organization_id) {
    return { error: 'You are not a member of this organization' }
  }

  // Check if already marked
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { error: 'You have already marked attendance for this session' }
  }

  // Insert attendance record
  const { error: insertError } = await supabase
    .from('attendance')
    .insert({
      session_id: sessionId,
      user_id: user.id,
    })

  if (insertError) {
    return { error: insertError.message }
  }

  return { success: true }
}