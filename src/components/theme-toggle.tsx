"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-full border-border bg-card/60 backdrop-blur-md hover:bg-accent/20 hover:text-primary transition-all duration-300 shadow-sm"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
    >
      <Sun className={`h-4 w-4 transition-transform duration-300 ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-amber-500"}`} />
      <Moon className={`absolute h-4 w-4 transition-transform duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100 text-cyan-400" : "-rotate-90 scale-0 opacity-0"}`} />
      <span className="sr-only">Toggle Theme</span>
    </Button>
  )
}
