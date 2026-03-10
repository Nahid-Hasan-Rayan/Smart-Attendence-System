'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LiveAttendanceCounterProps {
  sessionId: string
  initialCount: number
  totalMembers: number
}

export default function LiveAttendanceCounter({
  sessionId,
  initialCount,
  totalMembers,
}: LiveAttendanceCounterProps) {
  const [count, setCount] = useState(initialCount)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`attendance-count:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          setCount((c) => c + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase])

  return (
    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
      <span className="font-semibold">{count}</span> / {totalMembers} present
    </div>
  )
}