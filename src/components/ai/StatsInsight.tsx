"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useHabits } from '@/contexts/HabitContext';
import { useToast } from "@/hooks/use-toast";
import { format, subDays, eachDayOfInterval, differenceInDays, parseISO } from 'date-fns';
import { runGemini } from '@/lib/genai'; // Import client-side Gemini runner
import * as z from 'zod';

// Schema for expected output (client-side validation)
const AnalyzeStatsOutputSchema = z.object({
  insight: z
    .string()
    .describe(
      'A concise (1-2 sentences), actionable, and encouraging insight based on the provided stats. Example: "Your dedication is showing with an improving trend in completing your {activeHabitCount} habits! Keep up the great work on \'{highestPerformingHabit.name}\'. Maybe give \'{lowestPerformingHabit.name}\' a little extra focus this week?"'
    ),
});
type AnalyzeStatsOutput = z.infer<typeof AnalyzeStatsOutputSchema>;

interface AnalyzeStatsInput {
  overallCompletionTrend: string;
  lowestPerformingHabit?: { name: string; rate: number };
  highestPerformingHabit?: { name: string; rate: number };
  activeHabitCount: number;
  averageCompletionRateLast7Days?: number;
}

// Helper function to build the prompt
function buildStatsInsightPrompt(input: AnalyzeStatsInput): string {
  let prompt = `You are an encouraging and insightful AI habit coach.
The user is tracking ${input.activeHabitCount} habits.
Their overall completion trend is: ${input.overallCompletionTrend}.
`;
  if (input.averageCompletionRateLast7Days !== undefined) {
    prompt += `Their average completion rate in the last 7 days was ${input.averageCompletionRateLast7Days}%.
`;
  }
  if (input.highestPerformingHabit) {
    prompt += `Their best performing habit is '${input.highestPerformingHabit.name}' with ${input.highestPerformingHabit.rate}% success.
`;
  }
  if (input.lowestPerformingHabit) {
    prompt += `Their habit needing more attention is '${input.lowestPerformingHabit.name}' with ${input.lowestPerformingHabit.rate}% success.
`;
  } else {
    prompt += `All habits are doing well!
`;
  }
  prompt += `
Based on this, provide a concise (1-2 sentences), actionable, and encouraging insight.
If there's a lowest performing habit, gently suggest focusing on it. If all habits are doing well, celebrate that.
Be positive and motivational.

Output ONLY a valid JSON object in the format below. Do NOT include any other text or markdown formatting like \`\`\`json:
{
  "insight": "string"
}

Example if lowest performing habit exists:
{
  "insight": "Your dedication is showing with an ${input.overallCompletionTrend} trend in completing your ${input.activeHabitCount} habits! Keep up the great work, especially on '${input.highestPerformingHabit?.name || 'your habits'}'. Maybe give '${input.lowestPerformingHabit?.name || 'some habits'}' a little extra focus this week?"
}
Example if no lowest performing habit:
{
  "insight": "Fantastic work maintaining a ${input.overallCompletionTrend} trend across your ${input.activeHabitCount} habits! You're doing great with '${input.highestPerformingHabit?.name || 'your habits'}' and all your other habits are on track too!"
}
`;
  return prompt;
}


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
    }

    const habitSpecificCompletion = activeHabits.map(habit => {
      const relevantProgressEntries = Object.entries(habit.progress).filter(([dateStr]) => {
          const progressDate = parseISO(dateStr);
          return differenceInDays(endDate, progressDate) <= 30;
      });
      const completedEntries = relevantProgressEntries.filter(([, completed]) => completed).length;
      const denominator = relevantProgressEntries.length > 0 ? relevantProgressEntries.length : Math.min(30, differenceInDays(endDate, parseISO(habit.createdAt)) +1);
      return {
        name: habit.name,
        rate: denominator > 0 ? parseFloat(((completedEntries / denominator) * 100).toFixed(1)) : 0,
      };
    }).sort((a, b) => a.rate - b.rate);

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
      const inputData: AnalyzeStatsInput = {
        overallCompletionTrend: calculatedStats.overallCompletionTrend,
        lowestPerformingHabit: calculatedStats.lowestPerformingHabit,
        highestPerformingHabit: calculatedStats.highestPerformingHabit,
        activeHabitCount: calculatedStats.activeHabitCount,
        averageCompletionRateLast7Days: calculatedStats.averageCompletionRateLast7Days,
      };
      
      const prompt = buildStatsInsightPrompt(inputData);
      const resultText = await runGemini(prompt);

      let parsedResult: AnalyzeStatsOutput;
      try {
        parsedResult = JSON.parse(resultText);
      } catch (jsonError) {
        console.error("Failed to parse JSON response from AI for stats insight:", jsonError, "Raw response:", resultText);
        throw new Error("AI returned an invalid format for stats insight. Please try again.");
      }

      const validation = AnalyzeStatsOutputSchema.safeParse(parsedResult);
      if(!validation.success) {
          console.error("Zod validation failed for stats insight:", validation.error.errors, "Parsed data:", parsedResult);
          throw new Error("AI returned data in an unexpected structure for stats insight.");
      }
      
      setInsight(validation.data.insight);
    } catch (e: any) {
      console.error("Error fetching stats insight:", e);
      const errorMessage = e.message || "Failed to generate insight. Please check your API key and try again.";
      setError(errorMessage);
      toast({
        title: "AI Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isApiKeySet && activeHabits.length > 0 && !insight && !isLoading && !error) {
      // generateInsight(); // Optionally auto-generate
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiKeySet, activeHabits.length, calculatedStats]); 

  if (activeHabits.length === 0 && !isApiKeySet) return null;

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
