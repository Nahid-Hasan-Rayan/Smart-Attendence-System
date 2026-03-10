'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function generateQrCode(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get user's profile to check role and org
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'leader') {
    throw new Error('Forbidden')
  }

  // Verify session belongs to user's organization
  const { data: session } = await supabase
    .from('sessions')
    .select('organization_id')
    .eq('id', sessionId)
    .single()

  if (!session || session.organization_id !== profile.organization_id) {
    throw new Error('Session not found')
  }

  // Generate a random token (32 bytes hex)
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

  // Update session with token and expiry
  const { error } = await supabase
    .from('sessions')
    .update({ qr_token: token, qr_expires: expiresAt.toISOString() })
    .eq('id', sessionId)

  if (error) {
    throw new Error(error.message)
  }

  // Return token and expiry
  return { token, expiresAt: expiresAt.toISOString() }
}