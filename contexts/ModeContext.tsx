'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Mode = 'education' | 'corporate'

interface Terminology {
  leader: string
  member: string
  session: string
  group: string
  task: string
}

interface ModeContextType {
  mode: Mode
  setMode: (mode: Mode) => void
  terminology: Terminology
  primaryColor: string
  secondaryColor: string
}

const terminologyMap: Record<Mode, Terminology> = {
  education: {
    leader: 'Professor',
    member: 'Student',
    session: 'Class',
    group: 'Class',
    task: 'Assignment',
  },
  corporate: {
    leader: 'Manager',
    member: 'Employee',
    session: 'Meeting',
    group: 'Team',
    task: 'Task',
  },
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({
  children,
  initialMode,
}: {
  children: React.ReactNode
  initialMode: Mode
}) {
  const [mode, setMode] = useState<Mode>(initialMode)

  // Persist mode in localStorage for client‑side navigation (optional)
  useEffect(() => {
    localStorage.setItem('mode', mode)
  }, [mode])

  const terminology = terminologyMap[mode]
  const primaryColor = mode === 'education' ? '#1a5fb4' : '#0f172a'
  const secondaryColor = mode === 'education' ? '#0f7ff' : '#1e293b'

  return (
    <ModeContext.Provider value={{ mode, setMode, terminology, primaryColor, secondaryColor }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}