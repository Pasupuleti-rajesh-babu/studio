
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Eye, EyeOff } from 'lucide-react';
import { HabitForm } from '@/components/habits/HabitForm';
import { HabitList } from '@/components/habits/HabitList';
import { NaturalLanguageInput } from '@/components/habits/NaturalLanguageInput';
import { StatsView } from '@/components/stats/StatsView';
import { DailySummary } from '@/components/ai/DailySummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export function HabitTrackerPage() {
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="space-y-8">
      <NaturalLanguageInput />
      
      <DailySummary />

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="font-headline text-3xl font-semibold tracking-tight">Your Habits</h2>
          <div className="flex gap-2">
            <Button onClick={() => setShowArchived(!showArchived)} variant="outline">
              {showArchived ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
            <Button onClick={() => setIsHabitFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Habit
            </Button>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-[300px] mb-4">
            <TabsTrigger value="active">Active Habits</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <HabitList showArchived={false} />
          </TabsContent>
          <TabsContent value="archived">
            <HabitList showArchived={true} />
          </TabsContent>
        </Tabs>
      </div>

      <StatsView />

      <HabitForm isOpen={isHabitFormOpen} setIsOpen={setIsHabitFormOpen} />
      
      {/* Placeholder for Gamified Challenge Generator */}
      <div className="mt-12 p-6 border border-dashed rounded-lg text-center glass-card">
        <h3 className="font-headline text-xl mb-2">Gamified Challenges (Coming Soon!)</h3>
        <p className="text-muted-foreground mb-4">AI-generated themed challenges to keep your motivation fresh.</p>
        <Button variant="secondary" disabled>Generate Challenge</Button>
      </div>
    </div>
  );
}
