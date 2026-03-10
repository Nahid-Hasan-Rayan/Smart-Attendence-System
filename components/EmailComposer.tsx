// components/EmailComposer.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Loader2 } from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string
  attendancePercentage?: number // we can fetch from analytics if needed
}

interface EmailComposerProps {
  organizationId: string
  organizationName: string
  onSuccess?: () => void
}

export default function EmailComposer({ organizationId, organizationName, onSuccess }: EmailComposerProps) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Fetch members when dialog opens
  useEffect(() => {
    if (!open) return

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('organization_id', organizationId)
        .eq('role', 'member')

      if (error) {
        console.error('Error fetching members:', error)
        return
      }

      // Optionally fetch attendance percentages (for placeholder)
      // For simplicity, we'll skip or compute on the fly.
      setMembers(data || [])
    }

    fetchMembers()
  }, [open, organizationId, supabase])

  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      setError('Please select at least one recipient.')
      return
    }
    if (!subject.trim()) {
      setError('Subject is required.')
      return
    }
    if (!body.trim()) {
      setError('Body is required.')
      return
    }

    setSending(true)
    setError('')

    try {
      // Get full recipient details
      const recipients = members.filter(m => selectedRecipients.includes(m.id)).map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        // attendancePercentage could be fetched here if needed
      }))

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject,
          body,
          organizationName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setSelectedRecipients([])
        setSubject('')
        setBody('')
        if (onSuccess) onSuccess()
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const toggleAll = () => {
    if (selectedRecipients.length === members.length) {
      setSelectedRecipients([])
    } else {
      setSelectedRecipients(members.map(m => m.id))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Send personalized emails to your members. Use placeholders: <code className="bg-muted p-1 rounded">{'{{name}}'}</code>,{' '}
            <code className="bg-muted p-1 rounded">{'{{attendancePercentage}}'}</code>,{' '}
            <code className="bg-muted p-1 rounded">{'{{organizationName}}'}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Recipients */}
          <div>
            <Label className="text-base">Recipients</Label>
            <div className="mt-2 border rounded-md p-3 max-h-48 overflow-y-auto">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={members.length > 0 && selectedRecipients.length === members.length}
                  onCheckedChange={toggleAll}
                />
                <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({members.length} members)
                </Label>
              </div>
              {members.map((member) => (
                <div key={member.id} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={member.id}
                    checked={selectedRecipients.includes(member.id)}
                    onCheckedChange={(checked) => {
                      setSelectedRecipients(prev =>
                        checked
                          ? [...prev, member.id]
                          : prev.filter(id => id !== member.id)
                      )
                    }}
                  />
                  <Label htmlFor={member.id} className="text-sm cursor-pointer flex-1">
                    {member.name} <span className="text-gray-500">({member.email})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Reminder: Attendance Report"
            />
          </div>

          {/* Body */}
          <div>
            <Label htmlFor="body">Body (HTML supported)</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hello {{name}}, your current attendance is {{attendancePercentage}}%."
              rows={8}
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">Emails sent successfully!</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}