
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
import { recommendHabitStrategies, RecommendHabitStrategiesInput } from '@/ai/flows/recommend-habit-strategies';
import type { Habit } from '@/types';
import { useToast } from "@/hooks/use-toast";

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
    } else if (isOpen && !habit) {
        setError("No habit selected for recommendations.");
    }
    
    if (!isOpen) { // Reset state when dialog closes
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
      const progressData = JSON.stringify(habit.progress); // Simple string representation for now
      const userGoals = `Improve consistency for habit: ${habit.name}. ${habit.description || ''}`; // Basic goal

      const input: RecommendHabitStrategiesInput = {
        habitName: habit.name,
        progressData,
        userGoals,
      };

      const result = await recommendHabitStrategies(input);
      setRecommendations(result.recommendations);
    } catch (e) {
      console.error("Error fetching recommendations:", e);
      setError("Failed to generate recommendations. Please check your API key and try again.");
      toast({
        title: "AI Error",
        description: "Could not generate recommendations.",
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
        <DialogFooter>
          {isApiKeySet && habit && !error && (
            <Button onClick={fetchRecommendations} disabled={isLoading} variant="outline">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Refresh Strategies
            </Button>
          )}
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
