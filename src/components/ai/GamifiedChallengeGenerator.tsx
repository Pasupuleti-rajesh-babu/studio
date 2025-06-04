
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, AlertTriangle, Dices, Trophy, CalendarDays, PlusSquare } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useHabits } from '@/contexts/HabitContext';
import { generateGamifiedChallenge, GenerateGamifiedChallengeInput, GenerateGamifiedChallengeOutput } from '@/ai/flows/generate-gamified-challenge';
import { useToast } from "@/hooks/use-toast";

export function GamifiedChallengeGenerator() {
  const [challenge, setChallenge] = useState<GenerateGamifiedChallengeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isApiKeySet } = useApiKey();
  const { habits, addHabit } = useHabits(); // Added addHabit
  const { toast } = useToast();

  const activeHabits = habits.filter(h => !h.archived);
  const canGenerate = isApiKeySet && activeHabits.length > 0;

  const handleGenerateChallenge = async () => {
    if (!isApiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key to generate challenges.",
        variant: "destructive",
      });
      return;
    }
    if (activeHabits.length === 0) {
        toast({
            title: "No Active Habits",
            description: "Add some habits before generating a challenge.",
        });
        return;
    }

    setIsLoading(true);
    setError(null);
    // Keep previous challenge visible while loading new one, or setChallenge(null) for blank slate
    // setChallenge(null); 

    try {
      const habitNames = activeHabits.map(h => h.name);
      const input: GenerateGamifiedChallengeInput = {
        trackedHabits: habitNames,
      };
      
      const result = await generateGamifiedChallenge(input);
      setChallenge(result);
      toast({
        title: "Challenge Generated!",
        description: `Your new quest: ${result.challengeTitle}`,
      });
    } catch (e) {
      console.error("Error generating gamified challenge:", e);
      setError("Failed to generate challenge. Please check your API key and try again.");
      toast({
        title: "AI Error",
        description: "Could not generate a new challenge.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChallengeAsHabit = () => {
    if (!challenge) return;

    const habitName = challenge.challengeTitle;
    const habitDescription = `${challenge.challengeDescription} This is a ${challenge.durationDays}-day challenge. Suggested reward: ${challenge.rewardSuggestion}`;

    addHabit({
      name: habitName,
      description: habitDescription,
    });

    toast({
      title: "Challenge Added as Habit!",
      description: `"${habitName}" is now in your habit list.`,
    });
    // Optionally clear the challenge after adding it
    // setChallenge(null); 
  };

  return (
    <Card className="mt-12 glass-card">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Dices className="mr-2 h-5 w-5 text-primary" />
          AI Gamified Challenge
        </CardTitle>
        <CardDescription>Spice up your routine with a fun, AI-generated challenge!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[150px]">
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Forging your epic quest...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="flex items-center text-destructive p-4 bg-destructive/10 rounded-md">
            <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {challenge && !isLoading && !error && (
          <div className="space-y-3 p-4 border border-border rounded-lg bg-background/30 dark:bg-background/20 shadow-sm">
            <h3 className="text-lg font-semibold text-primary flex items-center">
              <Sparkles className="mr-2 h-5 w-5" /> {challenge.challengeTitle}
            </h3>
            <p className="text-sm text-foreground/90">{challenge.challengeDescription}</p>
            <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="mr-2 h-4 w-4" />
                Duration: {challenge.durationDays} day{challenge.durationDays !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
                <Trophy className="mr-2 h-4 w-4" />
                Reward Suggestion: {challenge.rewardSuggestion}
            </div>
            <Button onClick={handleAddChallengeAsHabit} variant="outline" size="sm" className="mt-3">
              <PlusSquare className="mr-2 h-4 w-4" />
              Add as Habit
            </Button>
          </div>
        )}
        {!challenge && !isLoading && !error && !isApiKeySet && (
            <p className="text-sm text-destructive text-center p-4">
                Set your Gemini API key in settings to enable AI-powered challenges.
            </p>
        )}
        {!challenge && !isLoading && !error && isApiKeySet && activeHabits.length === 0 && (
             <p className="text-sm text-muted-foreground text-center p-4">
                Add some habits first to get personalized challenges.
            </p>
        )}
         {!challenge && !isLoading && !error && isApiKeySet && activeHabits.length > 0 && (
             <p className="text-sm text-muted-foreground text-center p-4">
                Ready for a new adventure? Click the button below!
            </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateChallenge} disabled={isLoading || !canGenerate} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Dices className="mr-2 h-4 w-4" />}
          {challenge ? 'Generate New Challenge' : 'Generate Challenge'}
        </Button>
      </CardFooter>
    </Card>
  );
}
