"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import { useHabits } from '@/contexts/HabitContext';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { runGemini } from '@/lib/genai'; // Import client-side Gemini runner
import * as z from 'zod';

// Schema for expected output (client-side validation)
const NaturalLanguageHabitCreationOutputSchema = z.object({
  name: z.string().describe('The name of the habit.'),
  description: z.string().describe('A short description of the habit.'),
  frequency: z.string().describe('The frequency of the habit (e.g., daily, weekly, specific days).'),
  time: z.string().optional().describe('The time of day for the habit, if applicable.'),
});
type NaturalLanguageHabitCreationOutput = z.infer<typeof NaturalLanguageHabitCreationOutputSchema>;

interface NaturalLanguageHabitCreationInput {
  sentence: string;
}

// Helper function to build the prompt
function buildNaturalLanguagePrompt(input: NaturalLanguageHabitCreationInput): string {
  return `You are a helpful assistant that converts natural language sentences into structured habit definitions.

Given the following sentence: "${input.sentence}"

Please extract the following information and output ONLY a valid JSON object in the format below. Do NOT include any other text or markdown formatting like \`\`\`json:
{
  "name": "string",
  "description": "string",
  "frequency": "string",
  "time": "string (optional)"
}

Example:
Sentence: "Run 3 km Tue/Thu"
Output:
{
  "name": "Run 3 km",
  "description": "Run 3 kilometers every Tuesday and Thursday",
  "frequency": "Tue/Thu"
}

Sentence: "Read a book for 20 minutes every evening"
Output:
{
  "name": "Read a book",
  "description": "Read a book for 20 minutes",
  "frequency": "every evening",
  "time": "evening"
}
`;
}


export function NaturalLanguageInput() {
  const [sentence, setSentence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addHabit } = useHabits();
  const { isApiKeySet } = useApiKey();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim()) return;

    if (!isApiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key in settings to use AI features.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const inputData: NaturalLanguageHabitCreationInput = { sentence };
      const prompt = buildNaturalLanguagePrompt(inputData);
      const resultText = await runGemini(prompt);

      let parsedResult: NaturalLanguageHabitCreationOutput;
      try {
        parsedResult = JSON.parse(resultText);
      } catch (jsonError) {
        console.error("Failed to parse JSON response from AI for NLP:", jsonError, "Raw response:", resultText);
        throw new Error("AI returned an invalid format for habit creation. Please try rephrasing.");
      }

      const validation = NaturalLanguageHabitCreationOutputSchema.safeParse(parsedResult);
      if(!validation.success) {
        console.error("Zod validation failed for NLP:", validation.error.errors, "Parsed data:", parsedResult);
        throw new Error("AI returned data in an unexpected structure for habit creation.");
      }
      const result = validation.data;

      addHabit({
        name: result.name,
        description: `${result.description} (Frequency: ${result.frequency}${result.time ? ", Time: " + result.time : ''})`,
      });
      toast({
        title: "Habit Created with AI!",
        description: `"${result.name}" was added to your habits.`,
      });
      setSentence('');
    } catch (error: any) {
      console.error("Error creating habit with AI:", error);
      const errorMessage = error.message || "Could not process habit creation. Check your API key and try again.";
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
    <Card className="mb-8 glass-card">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center"><Wand2 className="mr-2 h-5 w-5 text-primary" />Create Habit with AI</CardTitle>
        <CardDescription>Type a sentence like "Run 3 km Tue/Thu" or "Read a book for 20 minutes every evening".</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start gap-3">
          <Input
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="e.g., Meditate for 10 minutes daily"
            className="flex-grow"
            disabled={isLoading || !isApiKeySet}
          />
          <Button type="submit" disabled={isLoading || !sentence.trim() || !isApiKeySet} className="w-full sm:w-auto">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Create Habit
          </Button>
        </form>
        {!isApiKeySet && (
          <p className="mt-2 text-xs text-destructive">
            Set your Gemini API key in settings to enable this feature.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
