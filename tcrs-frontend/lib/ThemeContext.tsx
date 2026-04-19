'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
  isDark: boolean;
  t: Record<string, string>;
}

const DARK = {
  bg: '#07090f', bg2: '#0d1117', bg3: '#131820', card: '#161c26',
  border: '#1e2a3a', border2: '#243044',
  text: '#e8f0fe', text2: '#8b9ab5', text3: '#4a5568',
  accent: '#00d4ff', green: '#00e5a0', amber: '#ffb800',
  red: '#ff4d6d', purple: '#a78bfa', shadow: 'rgba(0,0,0,0.4)',
};

const LIGHT = {
  bg: '#f0f4f8', bg2: '#ffffff', bg3: '#e8eef4', card: '#ffffff',
  border: '#d1dce9', border2: '#b8c9db',
  text: '#0f1923', text2: '#4a6480', text3: '#8ba3bc',
  accent: '#0099cc', green: '#00a86b', amber: '#d4920a',
  red: '#d93054', purple: '#7c3aed', shadow: 'rgba(0,0,0,0.12)',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark', toggle: () => {}, isDark: true, t: DARK,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start with dark always — avoids SSR/client mismatch
  const [theme, setTheme]     = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only read localStorage after mount (client-side only)
    const saved = localStorage.getItem('tcrs-theme') as Theme;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('tcrs-theme', next);
      return next;
    });
  };

  const t = theme === 'dark' ? DARK : LIGHT;

  // During SSR / before mount: render with dark theme but suppress mismatch
  // suppressHydrationWarning on the wrapper div handles browser extension attributes
  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark', t }}>
      <div
        suppressHydrationWarning
        style={{
          background: t.bg,
          color: t.text,
          minHeight: '100vh',
          // Only animate after mount to avoid flash
          transition: mounted ? 'background 0.25s, color 0.25s' : 'none',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export { DARK, LIGHT };