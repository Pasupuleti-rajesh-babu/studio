"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, AlertTriangle, Dices, Trophy, CalendarDays, PlusSquare } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useHabits } from '@/contexts/HabitContext';
import { useToast } from "@/hooks/use-toast";
import { runGemini } from '@/lib/genai'; // Import client-side Gemini runner
import * as z from 'zod';

// Schema for the expected output (client-side validation)
const GenerateGamifiedChallengeOutputSchema = z.object({
  challengeTitle: z.string().describe('A short, catchy title for the habit challenge (max 10 words). Example: \'The 7-Day Hydration Hero Quest\''),
  challengeDescription: z.string().describe('An engaging description of the challenge, outlining its goals and rules (2-3 sentences). Example: \'Embark on a legendary journey to drink 8 glasses of water daily for 7 days! Track your progress and emerge a hydration champion.\''),
  durationDays: z.number().int().min(3).max(30).describe('The recommended duration of the challenge in days (choose from 7, 14, 21, or 30). Example: 7'),
  rewardSuggestion: z.string().describe('A creative and motivating non-monetary reward suggestion for completing the challenge (max 15 words). Example: \'Unlock an evening of your favorite guilt-free entertainment!\''),
});
type GenerateGamifiedChallengeOutput = z.infer<typeof GenerateGamifiedChallengeOutputSchema>;

interface GenerateGamifiedChallengeInput {
  trackedHabits: string[];
}

// Helper function to build the prompt
function buildGamifiedChallengePrompt(input: GenerateGamifiedChallengeInput): string {
  const habitsList = input.trackedHabits.length > 0 
    ? input.trackedHabits.map(habit => `- ${habit}`).join('\n')
    : '- General well-being and self-improvement.';

  return `You are a master game designer AI, specializing in creating motivating and fun "Habit Quests" (gamified challenges) for users trying to build positive habits.

The user is currently tracking these habits:
${habitsList}

Your task is to design a new Habit Quest. The quest should be:
- Thematic and Engaging: Give it a fun theme (e.g., adventurer, explorer, wizard, scientist, athlete).
- Supportive: It should ideally support one or more of the user's existing habits, or introduce a related micro-habit.
- Achievable: The goals should be clear and feel attainable.
- Motivating: Make it sound exciting!

Output ONLY a valid JSON object in the following format, adhering to the descriptions. Do NOT include any other text or markdown formatting like \`\`\`json:
{
  "challengeTitle": "string",
  "challengeDescription": "string",
  "durationDays": "number",
  "rewardSuggestion": "string"
}

Example "challengeTitle": "The 7-Day Hydration Hero Quest"
Example "challengeDescription": "Embark on a legendary journey to drink 8 glasses of water daily for 7 days! Track your progress and emerge a hydration champion."
Example "durationDays": 7 (must be one of 7, 14, 21, or 30)
Example "rewardSuggestion": "Unlock an evening of your favorite guilt-free entertainment!"

Ensure 'durationDays' is one of 7, 14, 21, or 30.
The theme should be subtle and integrated into the title and description.
If no habits are provided, create a general well-being quest.`;
}


export function GamifiedChallengeGenerator() {
  const [challenge, setChallenge] = useState<GenerateGamifiedChallengeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isApiKeySet } = useApiKey();
  const { habits, addHabit } = useHabits();
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

    try {
      const habitNames = activeHabits.map(h => h.name);
      const inputData: GenerateGamifiedChallengeInput = {
        trackedHabits: habitNames,
      };
      
      const prompt = buildGamifiedChallengePrompt(inputData);
      const resultText = await runGemini(prompt);
      
      let parsedResult: GenerateGamifiedChallengeOutput;
      try {
        parsedResult = JSON.parse(resultText);
      } catch (jsonError) {
        console.error("Failed to parse JSON response from AI:", jsonError, "Raw response:", resultText);
        throw new Error("AI returned an invalid format. Please try again.");
      }

      // Validate with Zod
      const validation = GenerateGamifiedChallengeOutputSchema.safeParse(parsedResult);
      if (!validation.success) {
        console.error("Zod validation failed:", validation.error.errors, "Parsed data:", parsedResult);
        throw new Error("AI returned data in an unexpected structure.");
      }
      
      setChallenge(validation.data);
      toast({
        title: "Challenge Generated!",
        description: `Your new quest: ${validation.data.challengeTitle}`,
      });
    } catch (e: any) {
      console.error("Error generating gamified challenge:", e);
      const errorMessage = e.message || "Failed to generate challenge. Please check your API key and try again.";
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
