
"use client";

import React from 'react';
import { useHabits } from '@/contexts/HabitContext';
import { HabitCard } from './HabitCard';
import { ListChecks } from 'lucide-react';

interface HabitListProps {
  showArchived?: boolean;
}

export function HabitList({ showArchived = false }: HabitListProps) {
  const { habits } = useHabits();

  const filteredHabits = habits.filter(habit => showArchived ? habit.archived : !habit.archived);

  if (filteredHabits.length === 0) {
    return (
      <div className="text-center py-10">
        <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium text-foreground font-headline">
          {showArchived ? 'No Archived Habits' : 'No Habits Yet'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {showArchived ? 'You haven\'t archived any habits.' : 'Get started by adding a new habit!'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredHabits.map(habit => (
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  );
}
