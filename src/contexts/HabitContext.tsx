
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Habit } from '@/types';
import { format } from 'date-fns';

const HABITS_STORAGE_KEY = 'habitlocal_habits';

interface HabitContextType {
  habits: Habit[];
  addHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'progress' | 'color'> & {name: string, description: string}) => void;
  updateHabit: (habitId: string, updatedData: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  deleteHabit: (habitId: string) => void;
  archiveHabit: (habitId: string, archive: boolean) => void;
  toggleHabitProgress: (habitId: string, date: Date) => void;
  getHabitById: (habitId: string) => Habit | undefined;
  getTodaysHabits: () => Habit[];
  getStreak: (habitId: string) => number;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

// Helper to generate distinct colors for habits
const habitColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(250, 60%, 60%)',
  'hsl(300, 60%, 60%)',
  'hsl(350, 60%, 60%)',
];

export function HabitProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useLocalStorage<Habit[]>(HABITS_STORAGE_KEY, []);

  const addHabit = useCallback((habitData: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'progress' | 'color'> & {name: string, description: string}) => {
    const newHabit: Habit = {
      ...habitData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      archived: false,
      progress: {},
      color: habitColors[habits.length % habitColors.length],
    };
    setHabits(prev => [...prev, newHabit]);
  }, [setHabits, habits.length]);

  const updateHabit = useCallback((habitId: string, updatedData: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, ...updatedData } : h));
  }, [setHabits]);

  const deleteHabit = useCallback((habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  }, [setHabits]);
  
  const archiveHabit = useCallback((habitId: string, archive: boolean) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, archived: archive } : h));
  }, [setHabits]);

  const toggleHabitProgress = useCallback((habitId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const newProgress = { ...h.progress };
        newProgress[dateString] = !newProgress[dateString];
        return { ...h, progress: newProgress };
      }
      return h;
    }));
  }, [setHabits]);

  const getHabitById = useCallback((habitId: string) => {
    return habits.find(h => h.id === habitId);
  }, [habits]);
  
  const getTodaysHabits = useCallback(() => {
    return habits.filter(habit => !habit.archived);
  }, [habits]);

  const getStreak = useCallback((habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0,0,0,0); // Normalize to start of day

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const dateString = format(currentDate, 'yyyy-MM-dd');
      if (habit.progress[dateString]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If not completed today, check yesterday for current streak
        if (streak === 0 && format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
           currentDate.setDate(currentDate.getDate() - 1);
           const yesterdayString = format(currentDate, 'yyyy-MM-dd');
           if(habit.progress[yesterdayString]) {
             // continue checking from yesterday
           } else {
             break;
           }
        } else {
          break;
        }
      }
    }
    return streak;
  }, [habits]);

  return (
    <HabitContext.Provider value={{ habits, addHabit, updateHabit, deleteHabit, archiveHabit, toggleHabitProgress, getHabitById, getTodaysHabits, getStreak }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits(): HabitContextType {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
}
