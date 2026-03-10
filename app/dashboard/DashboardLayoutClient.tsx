'use client'

import { ModeProvider } from '@/contexts/ModeContext'
import { ReactNode } from 'react'

export default function DashboardLayoutClient({
  children,
  initialMode,
}: {
  children: ReactNode
  initialMode: 'education' | 'corporate'
}) {
  return (
    <ModeProvider initialMode={initialMode}>
      <div className="flex h-screen">
        {/* Sidebar will be added later; for now just the main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </ModeProvider>
  )
}