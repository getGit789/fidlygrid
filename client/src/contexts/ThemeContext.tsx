import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      // Dark theme colors
      root.style.setProperty('--app-bg', '#212121');
      root.style.setProperty('--sidebar-bg', '#171717');
      root.style.setProperty('--card-bg', '#171717');
      root.style.setProperty('--input-bg', '#171717');
      root.style.setProperty('--popover-bg', '#171717');
      root.style.setProperty('--button-bg', '#171717');
      root.style.setProperty('--timer-bg', '#171717');
      root.style.setProperty('--timer-button-bg', '#171717');
    } else {
      // Light theme colors
      root.style.setProperty('--app-bg', '#f0f4f7');
      root.style.setProperty('--sidebar-bg', '#f5f5f5');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--popover-bg', '#ffffff');
      root.style.setProperty('--button-bg', '#f0f4f7');
      root.style.setProperty('--timer-bg', '#ffffff');
      root.style.setProperty('--timer-button-bg', '#f0f4f7');
    }
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
