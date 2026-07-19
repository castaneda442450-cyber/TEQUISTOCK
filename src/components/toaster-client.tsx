'use client'

import { Toaster } from 'sileo'

export function ToasterClient() {
  return (
    <Toaster
      position="bottom-center"
      options={{
        fill: '#FFFFFF',
        roundness: 16,
        autopilot: { expand: 800, collapse: 200 },
        styles: {
          title: '!text-stone-900',
          description: '!text-stone-700',
        },
      }}
    />
  )
}
