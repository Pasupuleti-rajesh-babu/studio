
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, KeyRound, Moon, Sun, BrainCircuit } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { useTheme } from '@/contexts/ThemeProvider'; 
import Link from 'next/link';

export function Header() {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = React.useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };
  
  const CurrentThemeIcon = resolvedTheme === 'dark' ? Sun : Moon;


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            <span className="font-headline text-xl font-bold tracking-tight">HabitLocal</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              <CurrentThemeIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsApiKeyModalOpen(true)} aria-label="API Key Settings">
              <KeyRound className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <ApiKeyModal isOpen={isApiKeyModalOpen} setIsOpen={setIsApiKeyModalOpen} />
    </>
  );
}
