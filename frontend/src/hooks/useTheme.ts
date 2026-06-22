import { useState } from 'react'
import { applyTheme, getTheme, type Theme } from '../store/theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme())

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return { theme, toggle }
}
