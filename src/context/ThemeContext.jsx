import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nexus_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('nexus_theme', theme);
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-cyberpunk', 'theme-matrix', 'theme-light');

    if (theme === 'cyberpunk') {
      root.classList.add('dark', 'theme-cyberpunk');
    } else if (theme === 'matrix') {
      root.classList.add('dark', 'theme-matrix');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('theme-light');
    }
  }, [theme]);

  const cycleTheme = () => {
    const themes = ['dark', 'cyberpunk', 'matrix', 'light'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, isDark: theme !== 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
