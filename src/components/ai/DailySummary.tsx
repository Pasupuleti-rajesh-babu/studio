
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useHabits } from '@/contexts/HabitContext';
import { getDailyMicroSummary, DailyMicroSummaryInput } from '@/ai/flows/daily-micro-summary';
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from 'date-fns';

export function DailySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isApiKeySet } = useApiKey();
  const { habits } = useHabits();
  const { toast } = useToast();

  const activeHabits = habits.filter(h => !h.archived);

  const generateSummary = async () => {
    if (!isApiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key to get AI summaries.",
        variant: "destructive",
      });
      return;
    }
    if (activeHabits.length === 0) {
        toast({
            title: "No Active Habits",
            description: "Track some habits to get a daily summary.",
        });
        return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const yesterday = subDays(new Date(), 1);
      const yesterdayString = format(yesterday, 'yyyy-MM-dd');
      
      const habitsCompleted = activeHabits.filter(h => h.progress[yesterdayString]).length;
      const totalHabits = activeHabits.length;
      const completionRate = totalHabits > 0 ? (habitsCompleted / totalHabits) * 100 : 0;
      
      const longestStreak = Math.max(0, ...activeHabits.map(h => {
        let streak = 0;
        let currentDate = new Date();
        // eslint-disable-next-line no-constant-condition
        while(true) {
            const dateKey = format(currentDate, 'yyyy-MM-dd');
            if(h.progress[dateKey]) {
                streak++;
                currentDate = subDays(currentDate, 1);
            } else {
                break;
            }
        }
        return streak;
     }));

      const input: DailyMicroSummaryInput = {
        completionRate: parseFloat(completionRate.toFixed(1)),
        totalHabits,
        habitsCompleted,
        longestStreak,
      };
      
      const result = await getDailyMicroSummary(input);
      setSummary(result.summary);
    } catch (e) {
      console.error("Error fetching daily summary:", e);
      setError("Failed to generate summary. Please check your API key and try again.");
      toast({
        title: "AI Error",
        description: "Could not generate daily summary.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Automatically generate summary on load if API key is set and habits exist
  useEffect(() => {
    if (isApiKeySet && activeHabits.length > 0) {
      generateSummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiKeySet, activeHabits.length]); // Only run when API key status or habit count changes significantly

  return (
    <Card className="my-8 glass-card">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" />AI Daily Micro-Summary</CardTitle>
        <CardDescription>A quick AI-powered recap of yesterday's habit performance.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Generating summary...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="flex items-center text-destructive p-4 bg-destructive/10 rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}
        {summary && !isLoading && !error && (
          <p className="text-foreground leading-relaxed">{summary}</p>
        )}
        {!summary && !isLoading && !error && isApiKeySet && activeHabits.length > 0 && (
            <p className="text-muted-foreground">Click the button to generate your daily summary.</p>
        )}
         {!isApiKeySet && (
          <p className="text-sm text-destructive">
            Set your Gemini API key in settings to enable AI summaries.
          </p>
        )}
        {isApiKeySet && activeHabits.length === 0 && (
            <p className="text-sm text-muted-foreground">Add some habits to get a daily summary.</p>
        )}
        <Button onClick={generateSummary} disabled={isLoading || !isApiKeySet || activeHabits.length === 0} className="mt-4">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {summary ? 'Refresh Summary' : 'Get Today\'s Summary'}
        </Button>
      </CardContent>
    </Card>
  );
}
