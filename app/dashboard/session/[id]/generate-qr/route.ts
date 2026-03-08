import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params to get the session ID
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's profile to check role and org
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify session belongs to user's organization
  const { data: session } = await supabase
    .from('sessions')
    .select('organization_id')
    .eq('id', id)
    .single()

  if (!session || session.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Generate a random token (32 bytes hex)
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

  // Update session with token and expiry
  const { error } = await supabase
    .from('sessions')
    .update({ qr_token: token, qr_expires: expiresAt.toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return token and expiry to be encoded in the QR
  return NextResponse.json({ token, expiresAt })
}