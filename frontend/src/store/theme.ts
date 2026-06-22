export type Theme = 'dark' | 'light'

const KEY = 'vitapair-theme'

export function getTheme(): Theme {
  return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('light', theme === 'light')
  localStorage.setItem(KEY, theme)
}
