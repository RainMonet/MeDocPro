import React, { createContext, useContext, useState, useEffect } from 'react'

// Create the theme context
const ThemeContext = createContext()

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to light mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('medocpro-theme')
      return savedTheme === 'dark'
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
      return false
    }
  })

  // Apply theme to document and save to localStorage
  useEffect(() => {
    try {
      const theme = isDarkMode ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('medocpro-theme', theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }, [isDarkMode])

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  // Set specific theme
  const setTheme = (theme) => {
    setIsDarkMode(theme === 'dark')
  }

  const value = {
    isDarkMode,
    theme: isDarkMode ? 'dark' : 'light',
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext