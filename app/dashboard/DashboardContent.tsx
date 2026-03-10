'use client'

import { useMode } from '@/contexts/ModeContext'
import Link from 'next/link'

interface Profile {
  role: 'leader' | 'member'
  organization_id: string
}

interface Organization {
  name: string
  join_code: string
  mode: 'education' | 'corporate'
}

interface Session {
  id: string
  title: string
  start_time: string
  // add other fields as needed
}

interface DashboardContentProps {
  profile: Profile
  organization: Organization
  sessions: Session[]
  userEmail: string
}

export default function DashboardContent({
  profile,
  organization,
  sessions,
  userEmail,
}: DashboardContentProps) {
  const { terminology, primaryColor } = useMode() // secondaryColor not used, but fine

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
            Dashboard
          </h1>
          {profile.role === 'leader' && (
            <Link
              href="/dashboard/create-session"
              className="text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              + New {terminology.session}
            </Link>
          )}
        </div>

        <p className="text-gray-600 mb-6">
          You are a <span className="font-semibold" style={{ color: primaryColor }}>
            {profile.role === 'leader' ? terminology.leader : terminology.member}
          </span>{' '}
          of <span className="font-semibold">{organization.name}</span>.
        </p>

        {profile.role === 'leader' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Organization Join Code</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-2xl font-mono">{organization.join_code}</p>
              <p className="text-sm text-gray-500 mt-1">
                Share this code with {terminology.member}s who want to join.
              </p>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">
          {terminology.session}s
        </h2>

        {!sessions || sessions.length === 0 ? (
          <p className="text-gray-600">No {terminology.session.toLowerCase()}s yet.</p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((session) => (
              <li key={session.id} className="bg-white p-4 rounded-lg shadow">
                <Link href={`/dashboard/session/${session.id}`}>
                  <h3 className="text-xl font-semibold hover:underline" style={{ color: primaryColor }}>
                    {session.title}
                  </h3>
                </Link>
                <p className="text-gray-600">
                  {new Date(session.start_time).toLocaleDateString()} at{' '}
                  {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}