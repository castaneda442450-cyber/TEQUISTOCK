'use client'

import { Toaster } from 'sileo'
import { useTheme } from 'next-themes'

export function ToasterClient() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Toaster
      position="bottom-center"
      options={{
        fill: isDark ? '#F5F0EB' : '#1C1714',
        roundness: 16,
        autopilot: { expand: 800, collapse: 200 },
        styles: {
          title: isDark ? '!text-stone-900' : '!text-white',
          description: isDark ? '!text-stone-700' : '!text-white/75',
        },
      }}
    />
  )
}
