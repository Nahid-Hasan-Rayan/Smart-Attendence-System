'use client'

import { useState } from 'react'
import Link from 'next/link'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance'
import LiveAttendanceCounter from '@/components/LiveAttendanceCounter'

interface Session {
  id: string
  title: string
  start_time: string
  location?: {
    lat: number
    lng: number
    radius: number
    address?: string
  }
}

interface AttendanceRecord {
  user_id: string
  checked_in_at: string
  device_fingerprint?: string
  profiles: { name: string }
}

interface SessionContentProps {
  session: Session
  initialAttendance: AttendanceRecord[]
  userRole: 'leader' | 'member'
  userId: string
  totalMembers: number
}

export default function SessionContent({
  session,
  initialAttendance,
  userRole,
  userId,
  totalMembers,
}: SessionContentProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance)

  useRealtimeAttendance(session.id, (newAttendance) => {
    const transformed: AttendanceRecord = {
      user_id: newAttendance.user_id,
      checked_in_at: newAttendance.checked_in_at,
      device_fingerprint: undefined,
      profiles: { name: newAttendance.profiles?.name || 'Unknown' }
    }
    setAttendance((prev) => [...prev, transformed])
  })

  // Consistent date formatting options
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">{session.title}</h1>

        <p className="text-gray-600 mb-2">
          {new Date(session.start_time).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          })} at{' '}
          {new Date(session.start_time).toLocaleTimeString('en-US', timeOptions)}
        </p>

        {session.location && (
          <div className="mb-4 p-3 bg-gray-100 rounded">
            <h3 className="font-semibold">Location</h3>
            <p className="text-sm">
              📍 {session.location.address || 'No address provided'}<br />
              <span className="text-xs text-gray-600">
                (Lat: {session.location.lat.toFixed(4)}, Lng: {session.location.lng.toFixed(4)}, Radius: {session.location.radius}m)
              </span>
            </p>
          </div>
        )}

        {userRole === 'leader' && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">QR Code</h2>
            <QRCodeDisplay sessionId={session.id} />
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Attendance</h2>
            {userRole === 'leader' && (
              <LiveAttendanceCounter
                sessionId={session.id}
                initialCount={attendance.length}
                totalMembers={totalMembers}
              />
            )}
          </div>

          {userRole === 'leader' ? (
            attendance.length === 0 ? (
              <p className="text-gray-600">No attendance recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Checked In At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device Fingerprint
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.map((record) => (
                      <tr key={record.user_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.profiles.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.checked_in_at).toLocaleString('en-US', dateTimeOptions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.device_fingerprint || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <p className="text-gray-600">
              Your attendance will be recorded when you scan the QR code during the session.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}