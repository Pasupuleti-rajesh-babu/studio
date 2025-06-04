
'use server';
/**
 * @fileOverview A Genkit flow for generating gamified habit challenges.
 *
 * - generateGamifiedChallenge - A function that creates a themed habit challenge.
 * - GenerateGamifiedChallengeInput - The input type for the generateGamifiedChallenge function.
 * - GenerateGamifiedChallengeOutput - The return type for the generateGamifiedChallenge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGamifiedChallengeInputSchema = z.object({
  trackedHabits: z.array(z.string()).describe('A list of the names of habits the user is currently tracking.'),
});
export type GenerateGamifiedChallengeInput = z.infer<typeof GenerateGamifiedChallengeInputSchema>;

const GenerateGamifiedChallengeOutputSchema = z.object({
  challengeTitle: z.string().describe('A short, catchy title for the habit challenge (max 10 words). Example: \'The 7-Day Hydration Hero Quest\''),
  challengeDescription: z.string().describe('An engaging description of the challenge, outlining its goals and rules (2-3 sentences). Example: \'Embark on a legendary journey to drink 8 glasses of water daily for 7 days! Track your progress and emerge a hydration champion.\''),
  durationDays: z.number().int().min(3).max(30).describe('The recommended duration of the challenge in days (choose from 7, 14, 21, or 30). Example: 7'),
  rewardSuggestion: z.string().describe('A creative and motivating non-monetary reward suggestion for completing the challenge (max 15 words). Example: \'Unlock an evening of your favorite guilt-free entertainment!\''),
});
export type GenerateGamifiedChallengeOutput = z.infer<typeof GenerateGamifiedChallengeOutputSchema>;

export async function generateGamifiedChallenge(input: GenerateGamifiedChallengeInput): Promise<GenerateGamifiedChallengeOutput> {
  return generateGamifiedChallengeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGamifiedChallengePrompt',
  input: {schema: GenerateGamifiedChallengeInputSchema},
  output: {schema: GenerateGamifiedChallengeOutputSchema},
  prompt: `You are a master game designer AI, specializing in creating motivating and fun "Habit Quests" (gamified challenges) for users trying to build positive habits.

The user is currently tracking these habits:
{{#if trackedHabits}}
{{#each trackedHabits}}
- {{{this}}}
{{/each}}
{{else}}
- General well-being and self-improvement.
{{/if}}

Your task is to design a new Habit Quest. The quest should be:
- **Thematic and Engaging:** Give it a fun theme (e.g., adventurer, explorer, wizard, scientist, athlete).
- **Supportive:** It should ideally support one or more of the user's existing habits, or introduce a related micro-habit.
- **Achievable:** The goals should be clear and feel attainable.
- **Motivating:** Make it sound exciting!

Output the Habit Quest in the following JSON format, adhering to the descriptions:
\`\`\`json
{
  "challengeTitle": "string // A short, catchy title (max 10 words). Example: 'The 7-Day Hydration Hero Quest'",
  "challengeDescription": "string // A brief, engaging description of the quest and its rules (2-3 sentences). Example: 'Embark on a legendary journey to drink 8 glasses of water daily for 7 days! Track your progress and emerge a hydration champion.'",
  "durationDays": "number // Quest duration in days (choose from 7, 14, 21, or 30). Example: 7",
  "rewardSuggestion": "string // A fun, non-monetary reward suggestion (max 15 words). Example: 'Unlock an evening of your favorite guilt-free entertainment!'"
}
\`\`\`

Make sure the \`durationDays\` is one of the specified values (7, 14, 21, or 30).
The theme should be subtle and integrated into the title and description.
If no habits are provided, create a general well-being quest.`,
});

const generateGamifiedChallengeFlow = ai.defineFlow(
  {
    name: 'generateGamifiedChallengeFlow',
    inputSchema: GenerateGamifiedChallengeInputSchema,
    outputSchema: GenerateGamifiedChallengeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
