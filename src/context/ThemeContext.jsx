import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const AVAILABLE_THEMES = [
  { id: 'dark', name: 'Obsidian Slate', description: 'Deep slate modern dark theme', color: '#090d16', accent: '#14b8a6', icon: 'Moon' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', description: 'Electric violet & neon purple', color: '#0a0614', accent: '#a855f7', icon: 'Zap' },
  { id: 'matrix', name: 'Matrix Terminal', description: 'Hacker green phosphor terminal', color: '#030d06', accent: '#22c55e', icon: 'Terminal' },
  { id: 'dracula', name: 'Dracula Midnight', description: 'Classic vampire purple & soft pastel', color: '#1e1f29', accent: '#bd93f9', icon: 'Flame' },
  { id: 'synthwave', name: 'Synthwave 84', description: 'Retro 80s outrun sunset glow', color: '#1a102f', accent: '#f72585', icon: 'Sparkles' },
  { id: 'nord', name: 'Nordic Frost', description: 'Cool arctic fjord blue tones', color: '#242933', accent: '#88c0d0', icon: 'Compass' },
  { id: 'light', name: 'Minimal Paper', description: 'Clean daylight reading canvas', color: '#ffffff', accent: '#0d9488', icon: 'Sun' }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nexus_theme') || 'dark';
  });
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('nexus_theme', theme);
    const root = document.documentElement;
    root.classList.remove(
      'dark',
      'theme-cyberpunk',
      'theme-matrix',
      'theme-dracula',
      'theme-synthwave',
      'theme-nord',
      'theme-light'
    );

    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.add('dark');
      if (theme !== 'dark') {
        root.classList.add(`theme-${theme}`);
      }
    }
  }, [theme]);

  const cycleTheme = () => {
    const themeIds = AVAILABLE_THEMES.map((t) => t.id);
    const nextIndex = (themeIds.indexOf(theme) + 1) % themeIds.length;
    setTheme(themeIds[nextIndex]);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        cycleTheme,
        isDark: theme !== 'light',
        isThemePickerOpen,
        setIsThemePickerOpen,
        availableThemes: AVAILABLE_THEMES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

