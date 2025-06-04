
'use server';
/**
 * @fileOverview A Genkit flow for analyzing user habit statistics and providing insights.
 *
 * - analyzeStats - A function that generates a textual insight based on habit stats.
 * - AnalyzeStatsInput - The input type for the analyzeStats function.
 * - AnalyzeStatsOutput - The return type for the analyzeStats function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStatsInputSchema = z.object({
  overallCompletionTrend: z
    .string()
    .describe(
      "A brief description of the user's overall habit completion trend (e.g., 'improving', 'declining', 'stable')."
    ),
  lowestPerformingHabit: z
    .object({
      name: z.string(),
      rate: z.number().min(0).max(100),
    })
    .optional()
    .describe('The habit with the lowest completion rate (name and rate 0-100).'),
  highestPerformingHabit: z
    .object({
      name: z.string(),
      rate: z.number().min(0).max(100),
    })
    .optional()
    .describe('The habit with the highest completion rate (name and rate 0-100).'),
  activeHabitCount: z.number().int().min(0).describe('Total number of active habits.'),
  averageCompletionRateLast7Days: z.number().min(0).max(100).optional().describe('Average completion rate for the last 7 days.'),
});
export type AnalyzeStatsInput = z.infer<typeof AnalyzeStatsInputSchema>;

const AnalyzeStatsOutputSchema = z.object({
  insight: z
    .string()
    .describe(
      'A concise (1-2 sentences), actionable, and encouraging insight based on the provided stats. Example: "Your dedication is showing with an improving trend in completing your {activeHabitCount} habits! Keep up the great work on \'{highestPerformingHabit.name}\'. Maybe give \'{lowestPerformingHabit.name}\' a little extra focus this week?"'
    ),
});
export type AnalyzeStatsOutput = z.infer<typeof AnalyzeStatsOutputSchema>;

export async function analyzeStats(input: AnalyzeStatsInput): Promise<AnalyzeStatsOutput> {
  return analyzeStatsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeStatsPrompt',
  input: {schema: AnalyzeStatsInputSchema},
  output: {schema: AnalyzeStatsOutputSchema},
  prompt: `You are an encouraging and insightful AI habit coach.
The user is tracking {{activeHabitCount}} habits.
Their overall completion trend is: {{overallCompletionTrend}}.
{{#if averageCompletionRateLast7Days}}Their average completion rate in the last 7 days was {{averageCompletionRateLast7Days}}%.{{/if}}
{{#if highestPerformingHabit}}Their best performing habit is '{{highestPerformingHabit.name}}' with {{highestPerformingHabit.rate}}% success.{{/if}}
{{#if lowestPerformingHabit}}Their habit needing more attention is '{{lowestPerformingHabit.name}}' with {{lowestPerformingHabit.rate}}% success.{{else}}All habits are doing well!{{/if}}

Based on this, provide a concise (1-2 sentences), actionable, and encouraging insight.
If there's a lowest performing habit, gently suggest focusing on it. If all habits are doing well, celebrate that.
Be positive and motivational.

Example output format:
{
  "insight": "Your dedication is showing with an {{overallCompletionTrend}} trend in completing your {{activeHabitCount}} habits! Keep up the great work, especially on '{{highestPerformingHabit.name}}'. Maybe give '{{lowestPerformingHabit.name}}' a little extra focus this week?"
}
If no lowest performing habit:
{
  "insight": "Fantastic work maintaining a {{overallCompletionTrend}} trend across your {{activeHabitCount}} habits! You're doing great with '{{highestPerformingHabit.name}}' and all your other habits are on track too!"
}
`,
});

const analyzeStatsFlow = ai.defineFlow(
  {
    name: 'analyzeStatsFlow',
    inputSchema: AnalyzeStatsInputSchema,
    outputSchema: AnalyzeStatsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
