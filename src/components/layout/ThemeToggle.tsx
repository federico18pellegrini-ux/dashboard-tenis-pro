'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = (theme ?? 'dark') === 'dark'

  const shellStyle = {
    position: 'fixed' as const,
    top: 12,
    right: 12,
    zIndex: 9999,
    width: 52,
    height: 28,
    borderRadius: 14,
    border: 'none',
    cursor: 'pointer' as const,
    display: 'flex',
    alignItems: 'center',
    padding: '3px',
    transition: 'background 0.2s',
    background: isDark ? '#333' : '#22c55e',
  }

  const knobStyle = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    transform: isDark ? 'translateX(0)' : 'translateX(24px)',
    transition: 'transform 0.2s',
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-hidden
        disabled
        style={{
          ...shellStyle,
          cursor: 'default',
          opacity: 0.6,
          background: '#333',
        }}
      >
        <span style={{ ...knobStyle, transform: 'translateX(0)' }}>🌙</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      style={shellStyle}
      aria-label="Cambiar tema"
    >
      <span style={knobStyle}>{isDark ? '🌙' : '☀️'}</span>
    </button>
  )
}
