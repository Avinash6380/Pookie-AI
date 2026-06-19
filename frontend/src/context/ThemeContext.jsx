import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // Default to dark theme or pull from local storage
    return localStorage.getItem('pookie-theme') || 'dark';
  });

  useEffect(() => {
    // Mount theme selector onto the root HTML element
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pookie-theme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    const validThemes = ['dark', 'light', 'purple', 'pink'];
    if (validThemes.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
export default ThemeContext;
