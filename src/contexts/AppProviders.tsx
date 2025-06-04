
"use client";

import type { ReactNode } from 'react';
import { ApiKeyProvider } from './ApiKeyContext';
import { HabitProvider } from './HabitContext';
import { ThemeProvider } from './ThemeProvider'; // Assuming you might want a ThemeProvider for dark/light mode toggle later

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ApiKeyProvider>
        <HabitProvider>
          {children}
        </HabitProvider>
      </ApiKeyProvider>
    </ThemeProvider>
  );
}
