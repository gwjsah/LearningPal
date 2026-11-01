import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

const THEME_STORAGE_KEY = 'learningpal_theme';

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Reusable Paper / Chalkboard mode toggle button for auth & portal headers.
 */
export function ThemeToggleButton({ className = '' }) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to Paper Mode' : 'Switch to Chalkboard Mode'}
      title={darkMode ? 'Switch to Paper Mode' : 'Switch to Chalkboard Mode'}
      className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink dark:border-white/50 bg-paper dark:bg-chalkboard-surface text-xs font-bold text-ink dark:text-chalkboard-chalk shadow-notebook-sm hover:bg-highlighter-yellow/50 dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-redpen ${className}`}
    >
      {darkMode ? (
        <>
          <Sun className="w-3.5 h-3.5 text-highlighter-yellow" aria-hidden="true" />
          <span className="hidden sm:inline">Paper</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-ink-blue" aria-hidden="true" />
          <span className="hidden sm:inline">Chalkboard</span>
        </>
      )}
    </button>
  );
}
