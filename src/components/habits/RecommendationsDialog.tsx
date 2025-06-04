"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import type { Habit } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { runGemini } from '@/lib/genai'; // Import client-side Gemini runner
import * as z from 'zod';

// Schema for expected output (client-side validation)
const RecommendHabitStrategiesOutputSchema = z.object({
  recommendations: z.array(
    z.string().describe('A list of personalized strategies for improving habit consistency.')
  ).describe('Personalized habit improvement strategies based on user progress data.'),
});
type RecommendHabitStrategiesOutput = z.infer<typeof RecommendHabitStrategiesOutputSchema>;

interface RecommendHabitStrategiesInput {
  habitName: string;
  progressData: string; // JSON string
  userGoals: string;
}

// Helper function to build the prompt
function buildRecommendationsPrompt(input: RecommendHabitStrategiesInput): string {
  return `You are an AI assistant designed to provide personalized recommendations for improving habit consistency.

Analyze the user's habit progress data and goals, and suggest strategies to help them improve.

Habit Name: "${input.habitName}"
Progress Data (JSON format, dates and completion status): ${input.progressData}
User Goals: "${input.userGoals}"

Based on this information, provide a list of 2-4 personalized, actionable strategies that the user can implement to improve their consistency and achieve their goals.
Output ONLY a valid JSON object in the format below. Do NOT include any other text or markdown formatting like \`\`\`json:
{
  "recommendations": ["strategy 1", "strategy 2", "strategy 3"]
}
`;
}


interface RecommendationsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  habit: Habit | null;
}

export function RecommendationsDialog({ isOpen, setIsOpen, habit }: RecommendationsDialogProps) {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isApiKeySet } = useApiKey();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && habit && isApiKeySet) {
      fetchRecommendations();
    } else if (isOpen && !isApiKeySet) {
        setError("API Key is not set. Please configure it in settings to get AI recommendations.");
        setIsLoading(false);
    } else if (isOpen && !habit) {
        setError("No habit selected for recommendations.");
        setIsLoading(false);
    }
    
    if (!isOpen) { 
        setRecommendations([]);
        setError(null);
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, habit, isApiKeySet]);

  const fetchRecommendations = async () => {
    if (!habit) return;

    setIsLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      const progressData = JSON.stringify(habit.progress); 
      const userGoals = `Improve consistency for habit: ${habit.name}. ${habit.description || ''}`; 

      const inputData: RecommendHabitStrategiesInput = {
        habitName: habit.name,
        progressData,
        userGoals,
      };

      const prompt = buildRecommendationsPrompt(inputData);
      const resultText = await runGemini(prompt);
      
      let parsedResult: RecommendHabitStrategiesOutput;
      try {
        parsedResult = JSON.parse(resultText);
      } catch (jsonError) {
        console.error("Failed to parse JSON response from AI for recommendations:", jsonError, "Raw response:", resultText);
        throw new Error("AI returned an invalid format for recommendations. Please try again.");
      }
      
      const validation = RecommendHabitStrategiesOutputSchema.safeParse(parsedResult);
      if (!validation.success) {
          console.error("Zod validation failed for recommendations:", validation.error.errors, "Parsed data:", parsedResult);
          throw new Error("AI returned data in an unexpected structure for recommendations.");
      }

      setRecommendations(validation.data.recommendations);
    } catch (e: any) {
      console.error("Error fetching recommendations:", e);
      const errorMessage = e.message || "Failed to generate recommendations. Please check your API key and try again.";
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg glass-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-primary" />
            AI Strategies for "{habit?.name}"
          </DialogTitle>
          <DialogDescription>
            Personalized tips to help you improve this habit.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3">Generating insights...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex items-center text-destructive p-4 bg-destructive/10 rounded-md">
              <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {!isLoading && !error && recommendations.length > 0 && (
            <ul className="space-y-3 list-disc list-inside text-sm">
              {recommendations.map((rec, index) => (
                <li key={index} className="leading-relaxed">{rec}</li>
              ))}
            </ul>
          )}
           {!isLoading && !error && recommendations.length === 0 && isApiKeySet && habit && (
             <p className="text-muted-foreground p-4 text-center">No specific recommendations available at this moment. Keep tracking your progress!</p>
           )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isApiKeySet && habit && !error && (
            <Button onClick={fetchRecommendations} disabled={isLoading} variant="outline" className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Refresh Strategies
            </Button>
          )}
          <Button onClick={() => setIsOpen(false)} className="w-full sm:w-auto">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
