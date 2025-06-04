'use server';

/**
 * @fileOverview Converts a natural language sentence into a structured habit definition.
 *
 * - naturalLanguageHabitCreation - A function that takes a natural language sentence as input and returns a structured habit definition.
 * - NaturalLanguageHabitCreationInput - The input type for the naturalLanguageHabitCreation function.
 * - NaturalLanguageHabitCreationOutput - The return type for the naturalLanguageHabitCreation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NaturalLanguageHabitCreationInputSchema = z.object({
  sentence: z.string().describe('A natural language sentence describing the habit.'),
});
export type NaturalLanguageHabitCreationInput = z.infer<
  typeof NaturalLanguageHabitCreationInputSchema
>;

const NaturalLanguageHabitCreationOutputSchema = z.object({
  name: z.string().describe('The name of the habit.'),
  description: z.string().describe('A short description of the habit.'),
  frequency: z
    .string() // Could be made more specific with an enum or union
    .describe('The frequency of the habit (e.g., daily, weekly, specific days).'),
  time: z
    .string() // Could be made more specific with a custom schema
    .optional()
    .describe('The time of day for the habit, if applicable.'),
});
export type NaturalLanguageHabitCreationOutput = z.infer<
  typeof NaturalLanguageHabitCreationOutputSchema
>;

export async function naturalLanguageHabitCreation(
  input: NaturalLanguageHabitCreationInput
): Promise<NaturalLanguageHabitCreationOutput> {
  return naturalLanguageHabitCreationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'naturalLanguageHabitCreationPrompt',
  input: {schema: NaturalLanguageHabitCreationInputSchema},
  output: {schema: NaturalLanguageHabitCreationOutputSchema},
  prompt: `You are a helpful assistant that converts natural language sentences into structured habit definitions.

  Given the following sentence: {{{sentence}}}

  Please extract the following information and format it as a JSON object:
  - name: A short, descriptive name for the habit.
  - description: A brief explanation of the habit.
  - frequency: How often the habit should be performed (e.g., daily, weekly, specific days).
  - time: The time of day for the habit, if specified.

  Example:
  Sentence: "Run 3 km Tue/Thu"
  Output:
  {
    "name": "Run 3 km",
    "description": "Run 3 kilometers every Tuesday and Thursday",
    "frequency": "Tue/Thu",
  }
  `,
});

const naturalLanguageHabitCreationFlow = ai.defineFlow(
  {
    name: 'naturalLanguageHabitCreationFlow',
    inputSchema: NaturalLanguageHabitCreationInputSchema,
    outputSchema: NaturalLanguageHabitCreationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
