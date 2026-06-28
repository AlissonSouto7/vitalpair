import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  set: (mode: ThemeMode) => void;
}

/**
 * Tema claro/escuro persistido. Aplique a classe no <html> num efeito:
 *   const mode = useTheme(s => s.mode);
 *   useEffect(() => {
 *     document.documentElement.classList.toggle('dark', mode === 'dark');
 *   }, [mode]);
 *
 * Pra evitar flash, rode antes do React montar (em index.html):
 *   <script>document.documentElement.classList.toggle('dark',
 *     (JSON.parse(localStorage.getItem('vp-theme') ?? '{}')?.state?.mode
 *      ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light')) === 'dark')</script>
 */
export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode:
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
      toggle: () => set((s) => ({ mode: s.mode === 'light' ? 'dark' : 'light' })),
      set: (mode) => set({ mode }),
    }),
    { name: 'vp-theme' }
  )
);
