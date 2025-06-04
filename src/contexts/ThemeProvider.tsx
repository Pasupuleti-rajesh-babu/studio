
"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string // "class" or "data-theme"
  enableSystem?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme?: "light" | "dark"
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  attribute = "class", // Standard for Tailwind
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => (typeof window !== "undefined" ? (localStorage.getItem(storageKey) as Theme) : undefined) || defaultTheme
  )
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">()

  React.useEffect(() => {
    const root = window.document.documentElement
    
    const applyTheme = (currentTheme: "light" | "dark") => {
      root.classList.remove("light", "dark")
      if (attribute === "class") {
        root.classList.add(currentTheme)
      } else {
        root.setAttribute(attribute, currentTheme)
      }
      setResolvedTheme(currentTheme)
    }

    let effectiveTheme = theme
    if (theme === "system" && enableSystem) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      effectiveTheme = mediaQuery.matches ? "dark" : "light"
      applyTheme(effectiveTheme) // Apply initial system theme

      const handleChange = () => {
        const systemTheme = mediaQuery.matches ? "dark" : "light"
        applyTheme(systemTheme)
      }
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    } else {
      applyTheme(theme as "light" | "dark")
    }
  }, [theme, enableSystem, attribute])


  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, newTheme)
      }
      setTheme(newTheme)
    },
    resolvedTheme
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
