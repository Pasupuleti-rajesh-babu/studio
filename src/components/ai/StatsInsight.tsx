
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useHabits } from '@/contexts/HabitContext';
import { analyzeStats, AnalyzeStatsInput } from '@/ai/flows/analyze-stats-flow';
import { useToast } from "@/hooks/use-toast";
import { format, subDays, eachDayOfInterval, differenceInDays, parseISO } from 'date-fns';
import type { Habit } from '@/types';

export function StatsInsight() {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isApiKeySet } = useApiKey();
  const { habits } = useHabits();
  const { toast } = useToast();

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);

  const calculatedStats = useMemo(() => {
    if (activeHabits.length === 0) return null;

    // Overall Completion Data (last 14 days for trend)
    const endDate = new Date();
    const startDate14 = subDays(endDate, 13);
    const dateInterval14 = eachDayOfInterval({ start: startDate14, end: endDate });

    const completionData14 = dateInterval14.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      let completedCount = 0;
      activeHabits.forEach(habit => {
        if (habit.progress[dateString]) {
          completedCount++;
        }
      });
      return {
        date: dateString,
        rate: activeHabits.length > 0 ? (completedCount / activeHabits.length) * 100 : 0,
      };
    });
    
    let overallCompletionTrend = 'stable';
    let averageCompletionRateLast7Days: number | undefined = undefined;

    if (completionData14.length >= 14) {
      const last7DaysRates = completionData14.slice(7).map(d => d.rate);
      const prev7DaysRates = completionData14.slice(0, 7).map(d => d.rate);
      const avgLast7 = last7DaysRates.reduce((sum, rate) => sum + rate, 0) / (last7DaysRates.length || 1);
      const avgPrev7 = prev7DaysRates.reduce((sum, rate) => sum + rate, 0) / (prev7DaysRates.length || 1);
      averageCompletionRateLast7Days = parseFloat(avgLast7.toFixed(1));

      if (avgLast7 > avgPrev7 + 5) overallCompletionTrend = 'improving';
      else if (avgLast7 < avgPrev7 - 5) overallCompletionTrend = 'declining';
    } else if (completionData14.length >= 7) {
        const last7DaysRates = completionData14.map(d => d.rate);
        averageCompletionRateLast7Days = parseFloat((last7DaysRates.reduce((sum, rate) => sum + rate, 0) / (last7DaysRates.length || 1)).toFixed(1));
        // Not enough data for a strong trend, keep as stable or derive from slope if desired
    }


    // Habit Specific Completion
    const habitSpecificCompletion = activeHabits.map(habit => {
      // Consider only progress within a relevant window, e.g., last 30 days or since creation if newer
      const relevantProgressEntries = Object.entries(habit.progress).filter(([dateStr]) => {
          const progressDate = parseISO(dateStr);
          return differenceInDays(endDate, progressDate) <= 30; // Max 30 days of history for rate
      });

      const completedEntries = relevantProgressEntries.filter(([, completed]) => completed).length;
      const totalConsideredDays = Math.max(1, relevantProgressEntries.length, differenceInDays(endDate, parseISO(habit.createdAt)) + 1); // Avoid division by zero
      
      // If no progress entries in last 30 days, but habit is new, use total days tracked
      // Default to total entries if no relevant ones, or since creation for newer habits
      const denominator = relevantProgressEntries.length > 0 ? relevantProgressEntries.length : Math.min(30, differenceInDays(endDate, parseISO(habit.createdAt)) +1);


      return {
        name: habit.name,
        // rate: totalConsideredDays > 0 ? parseFloat(((completedEntries / totalConsideredDays) * 100).toFixed(1)) : 0,
        rate: denominator > 0 ? parseFloat(((completedEntries / denominator) * 100).toFixed(1)) : 0,

      };
    }).sort((a, b) => a.rate - b.rate); // Sort by completion rate (ascending)

    const lowestPerformingHabit = habitSpecificCompletion.length > 0 && habitSpecificCompletion[0].rate < 100 ? habitSpecificCompletion[0] : undefined;
    const highestPerformingHabit = habitSpecificCompletion.length > 0 ? habitSpecificCompletion[habitSpecificCompletion.length - 1] : undefined;

    return {
      overallCompletionTrend,
      lowestPerformingHabit,
      highestPerformingHabit,
      activeHabitCount: activeHabits.length,
      averageCompletionRateLast7Days,
    };
  }, [activeHabits]);


  const generateInsight = async () => {
    if (!isApiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key for AI insights.",
        variant: "destructive",
      });
      return;
    }
    if (!calculatedStats) {
        toast({
            title: "Not Enough Data",
            description: "Track some habits to get AI insights on your stats.",
        });
        return;
    }

    setIsLoading(true);
    setError(null);
    setInsight(null);

    try {
      const input: AnalyzeStatsInput = {
        overallCompletionTrend: calculatedStats.overallCompletionTrend,
        lowestPerformingHabit: calculatedStats.lowestPerformingHabit,
        highestPerformingHabit: calculatedStats.highestPerformingHabit,
        activeHabitCount: calculatedStats.activeHabitCount,
        averageCompletionRateLast7Days: calculatedStats.averageCompletionRateLast7Days,
      };
      
      const result = await analyzeStats(input);
      setInsight(result.insight);
    } catch (e) {
      console.error("Error fetching stats insight:", e);
      setError("Failed to generate insight. Please check your API key and try again.");
      toast({
        title: "AI Error",
        description: "Could not generate stats insight.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Auto-generate if API key is set, habits exist, and no insight yet
    // Allow manual refresh even if an insight exists
    if (isApiKeySet && activeHabits.length > 0 && !insight && !isLoading && !error) {
      generateInsight();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiKeySet, activeHabits.length, calculatedStats]); // Re-run if critical data changes

  if (activeHabits.length === 0 && !isApiKeySet) return null; // Don't show card if no habits and no key

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center"><Bot className="mr-2 h-5 w-5 text-primary" />AI Stats Insight</CardTitle>
        <CardDescription>A quick AI-powered observation on your progress.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-[100px]">
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Analyzing your stats...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="flex items-center text-destructive p-4 bg-destructive/10 rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {insight && !isLoading && !error && (
          <p className="text-foreground leading-relaxed text-sm">{insight}</p>
        )}
        {!isLoading && !error && !insight && isApiKeySet && activeHabits.length > 0 && (
            <p className="text-muted-foreground text-sm">Click the button to generate an AI insight on your stats.</p>
        )}
         {!isApiKeySet && activeHabits.length > 0 && (
          <p className="text-sm text-destructive">
            Set your Gemini API key in settings to enable AI insights.
          </p>
        )}
        {isApiKeySet && activeHabits.length === 0 && (
            <p className="text-sm text-muted-foreground">Add and track some habits to get insights.</p>
        )}
        
        {(isApiKeySet && activeHabits.length > 0) && (
            <Button onClick={generateInsight} disabled={isLoading || !calculatedStats} className="mt-4" variant="outline" size="sm">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {insight ? 'Refresh Insight' : 'Get Insight'}
            </Button>
        )}
      </CardContent>
    </Card>
  );
}
