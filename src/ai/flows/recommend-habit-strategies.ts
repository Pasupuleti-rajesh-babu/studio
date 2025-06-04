'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing personalized habit improvement strategies based on user progress data.
 *
 * - recommendHabitStrategies - A function that takes user habit data and returns personalized recommendations.
 * - RecommendHabitStrategiesInput - The input type for the recommendHabitStrategies function.
 * - RecommendHabitStrategiesOutput - The return type for the recommendHabitStrategies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendHabitStrategiesInputSchema = z.object({
  habitName: z.string().describe('The name of the habit being tracked.'),
  progressData: z.string().describe('A JSON string containing the user\'s habit progress data, including dates and completion status.'),
  userGoals: z.string().describe('A description of the user\'s goals related to this habit.'),
});
export type RecommendHabitStrategiesInput = z.infer<typeof RecommendHabitStrategiesInputSchema>;

const RecommendHabitStrategiesOutputSchema = z.object({
  recommendations: z.array(
    z.string().describe('A list of personalized strategies for improving habit consistency.')
  ).describe('Personalized habit improvement strategies based on user progress data.'),
});
export type RecommendHabitStrategiesOutput = z.infer<typeof RecommendHabitStrategiesOutputSchema>;

export async function recommendHabitStrategies(input: RecommendHabitStrategiesInput): Promise<RecommendHabitStrategiesOutput> {
  return recommendHabitStrategiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendHabitStrategiesPrompt',
  input: {schema: RecommendHabitStrategiesInputSchema},
  output: {schema: RecommendHabitStrategiesOutputSchema},
  prompt: `You are an AI assistant designed to provide personalized recommendations for improving habit consistency.

  Analyze the user's habit progress data and goals, and suggest strategies to help them improve.

  Habit Name: {{{habitName}}}
  Progress Data: {{{progressData}}}
  User Goals: {{{userGoals}}}

  Based on this information, provide a list of personalized strategies that the user can implement to improve their consistency and achieve their goals.
  Format as a numbered list.
  `,
});

const recommendHabitStrategiesFlow = ai.defineFlow(
  {
    name: 'recommendHabitStrategiesFlow',
    inputSchema: RecommendHabitStrategiesInputSchema,
    outputSchema: RecommendHabitStrategiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
