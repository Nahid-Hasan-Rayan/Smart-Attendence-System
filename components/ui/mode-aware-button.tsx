'use client'

import { Button, ButtonProps } from './button' // adjust import based on button component
import { useMode } from '@/contexts/ModeContext'

export function ModeAwareButton(props: ButtonProps) {
  const { primaryColor } = useMode()
  return (
    <Button
      {...props}
      style={{ backgroundColor: primaryColor, ...props.style }}
      className={`text-white ${props.className || ''}`}
    />
  )
}