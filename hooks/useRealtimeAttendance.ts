import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

interface AttendanceRecord {
  id: string
  session_id: string
  user_id: string
  status: string
  checked_in_at: string
  profiles?: {
    name: string
  }
}

export function useRealtimeAttendance(
  sessionId: string,
  onAttendanceInsert: (newAttendance: AttendanceRecord) => void
) {
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to INSERT events on the attendance table for this session
    const channel = supabase
      .channel(`attendance:session_id=eq.${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload: RealtimePostgresInsertPayload<AttendanceRecord>) => {
          // Fetch the associated profile name because the payload only contains user_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', payload.new.user_id)
            .single()

          const newAttendance = {
            ...payload.new,
            profiles: profile ? { name: profile.name } : { name: 'Unknown' },
          }
          onAttendanceInsert(newAttendance)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, onAttendanceInsert])
}