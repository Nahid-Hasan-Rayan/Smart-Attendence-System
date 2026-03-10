import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { haversineDistance } from '@/lib/geo'

export async function POST(request: Request) {
  // Include deviceFingerprint in the destructured request body
  const { sessionId, token, userLocation, deviceFingerprint } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Verify token
  if (session.qr_token !== token) {
    return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
  }

  // Check expiry
  const now = new Date()
  const expires = new Date(session.qr_expires)
  if (now > expires) {
    return NextResponse.json({ error: 'QR code expired' }, { status: 400 })
  }

  // Check if user belongs to the same organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.organization_id !== session.organization_id) {
    return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 403 })
  }

  // Geolocation verification
  if (session.location) {
    if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
      return NextResponse.json({ error: 'Location required for this session' }, { status: 400 })
    }

    const distance = haversineDistance(
      session.location.lat,
      session.location.lng,
      userLocation.lat,
      userLocation.lng
    )

    if (distance > session.location.radius) {
      return NextResponse.json({
        error: `You are ${Math.round(distance)}m away from the allowed area. Max allowed: ${session.location.radius}m.`
      }, { status: 403 })
    }
  }

  // Check for duplicate attendance
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already marked attendance' }, { status: 409 })
  }

  // Insert attendance record with optional fields
  const insertData: any = {
    session_id: sessionId,
    user_id: user.id,
  }

  if (userLocation) {
    insertData.location = userLocation
  }

  // Store device fingerprint if provided
  if (deviceFingerprint) {
    insertData.device_fingerprint = deviceFingerprint
  }

  const { error: insertError } = await supabase
    .from('attendance')
    .insert(insertData)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}