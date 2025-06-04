
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import { useHabits } from '@/contexts/HabitContext';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { naturalLanguageHabitCreation, NaturalLanguageHabitCreationOutput } from '@/ai/flows/natural-language-habit-creation';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NaturalLanguageInput() {
  const [sentence, setSentence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addHabit } = useHabits();
  const { apiKey, isApiKeySet } = useApiKey();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim() || !isApiKeySet) {
      if(!isApiKeySet) {
        toast({
          title: "API Key Required",
          description: "Please set your Gemini API key in settings to use AI features.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      const result: NaturalLanguageHabitCreationOutput = await naturalLanguageHabitCreation({ sentence });
      addHabit({
        name: result.name,
        description: `${result.description} (Frequency: ${result.frequency}${result.time ? ", Time: " + result.time : ''})`,
      });
      toast({
        title: "Habit Created with AI!",
        description: `"${result.name}" was added to your habits.`,
      });
      setSentence('');
    } catch (error) {
      console.error("Error creating habit with AI:", error);
      toast({
        title: "AI Error",
        description: "Could not process habit creation. Check your API key and try again.",
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
