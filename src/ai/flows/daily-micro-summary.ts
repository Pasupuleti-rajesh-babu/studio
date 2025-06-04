'use server';

/**
 * @fileOverview A flow for providing a daily micro-summary of the user's habit completion rate and key stats.
 *
 * - getDailyMicroSummary - A function that generates the daily micro-summary.
 * - DailyMicroSummaryInput - The input type for the getDailyMicroSummary function.
 * - DailyMicroSummaryOutput - The return type for the getDailyMicroSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyMicroSummaryInputSchema = z.object({
  completionRate: z
    .number()
    .describe("The user's habit completion rate from the previous day (0-100)."),
  totalHabits: z.number().describe('The total number of habits the user is tracking.'),
  habitsCompleted: z
    .number()
    .describe('The number of habits the user completed yesterday.'),
  longestStreak: z
    .number()
    .describe('The length of the user’s longest habit streak.'),
});

export type DailyMicroSummaryInput = z.infer<typeof DailyMicroSummaryInputSchema>;

const DailyMicroSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A brief, one-sentence summary of the user’s habit completion rate and key statistics from the previous day.'
    ),
});

export type DailyMicroSummaryOutput = z.infer<typeof DailyMicroSummaryOutputSchema>;

export async function getDailyMicroSummary(input: DailyMicroSummaryInput): Promise<DailyMicroSummaryOutput> {
  return dailyMicroSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyMicroSummaryPrompt',
  input: {schema: DailyMicroSummaryInputSchema},
  output: {schema: DailyMicroSummaryOutputSchema},
  prompt: `Yesterday, you completed {{habitsCompleted}} out of {{totalHabits}} habits, resulting in a completion rate of {{completionRate}}%. Your longest streak is {{longestStreak}} days.

  Provide a single-sentence summary of this information, highlighting the most relevant information to motivate the user. Focus on positive achievements and potential areas for improvement.`,
});

const dailyMicroSummaryFlow = ai.defineFlow(
  {
    name: 'dailyMicroSummaryFlow',
    inputSchema: DailyMicroSummaryInputSchema,
    outputSchema: DailyMicroSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
