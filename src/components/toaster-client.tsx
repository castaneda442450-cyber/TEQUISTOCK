'use client'

import { Toaster } from 'sileo'
import { useTheme } from 'next-themes'

export function ToasterClient() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="bottom-center"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  )
}
