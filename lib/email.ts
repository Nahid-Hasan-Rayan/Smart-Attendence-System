// lib/email.ts
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender (free tier uses onboarding@resend.dev)
const DEFAULT_FROM = 'onboarding@resend.dev'; // Change to your verified domain later

export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  attendancePercentage?: number; // optional, for placeholders
}

export interface EmailOptions {
  to: EmailRecipient[];
  subject: string;
  body: string; // HTML allowed
  organizationName: string;
  scheduledAt?: Date; // optional, for future sending (not implemented in MVP)
}

/**
 * Replace placeholders in text with actual values.
 * Supported placeholders:
 *   {{name}} – recipient's name
 *   {{email}} – recipient's email
 *   {{attendancePercentage}} – recipient's attendance % (if available)
 *   {{organizationName}} – organization name
 */
function replacePlaceholders(
  text: string,
  recipient: EmailRecipient,
  organizationName: string
): string {
  return text
    .replace(/\{\{name\}\}/g, recipient.name)
    .replace(/\{\{email\}\}/g, recipient.email)
    .replace(/\{\{attendancePercentage\}\}/g, 
      recipient.attendancePercentage !== undefined 
        ? recipient.attendancePercentage.toString() 
        : 'N/A')
    .replace(/\{\{organizationName\}\}/g, organizationName);
}

/**
 * Send emails to multiple recipients.
 * Returns array of results for each recipient (success/failure).
 */
export async function sendBulkEmails(
  options: EmailOptions,
  supabase: any, // Supabase client for logging
  organizationId: string,
  senderId: string
): Promise<{ success: boolean; recipientId: string; error?: string }[]> {
  const results = [];

  for (const recipient of options.to) {
    try {
      // Replace placeholders for this recipient
      const personalizedSubject = replacePlaceholders(options.subject, recipient, options.organizationName);
      const personalizedBody = replacePlaceholders(options.body, recipient, options.organizationName);

      // Send via Resend
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to: recipient.email,
        subject: personalizedSubject,
        html: personalizedBody,
      });

      if (error) throw error;

      results.push({ success: true, recipientId: recipient.id });

      // Log success in messages table (if table exists)
      await supabase.from('messages').insert({
        organization_id: organizationId,
        sender_id: senderId,
        subject: personalizedSubject,
        body: personalizedBody,
        recipients: [recipient.id],
        sent_at: new Date().toISOString(),
        status: 'sent',
      }).maybeSingle(); // use maybeSingle to avoid error if table doesn't exist

    } catch (err: any) {
      console.error(`Failed to send to ${recipient.email}:`, err);
      results.push({ success: false, recipientId: recipient.id, error: err.message });

      // Log failure
      await supabase.from('messages').insert({
        organization_id: organizationId,
        sender_id: senderId,
        subject: options.subject,
        body: options.body,
        recipients: [recipient.id],
        status: 'failed',
      }).maybeSingle();
    }
  }

  return results;
}