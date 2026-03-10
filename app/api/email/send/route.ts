// app/api/email/send/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendBulkEmails, EmailRecipient } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { recipients, subject, body, organizationName } = await request.json()

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }
    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get sender's profile and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'leader') {
      return NextResponse.json({ error: 'Forbidden: Only leaders can send emails' }, { status: 403 })
    }

    if (!profile.organization_id) {
      return NextResponse.json({ error: 'You are not part of an organization' }, { status: 400 })
    }

    // Verify that all recipients belong to the same organization
    const recipientIds = recipients.map((r: EmailRecipient) => r.id)
    const { data: validMembers, error: memberError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', recipientIds)
      .eq('organization_id', profile.organization_id)
      .eq('role', 'member')

    if (memberError || validMembers.length !== recipientIds.length) {
      return NextResponse.json({ error: 'Invalid recipients' }, { status: 400 })
    }

    // Send emails
    const results = await sendBulkEmails(
      {
        to: recipients,
        subject,
        body,
        organizationName,
      },
      supabase,
      profile.organization_id,
      user.id
    )

    // Check if any failed
    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
      return NextResponse.json({
        warning: `${failures.length} emails failed to send`,
        results
      }, { status: 207 }) // 207 Multi-Status
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}