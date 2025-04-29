'use server';
/**
 * @fileOverview Summarizes transcribed meeting minutes by highlighting key decisions and action items.
 *
 * - summarizeMeetingMinutes - A function that summarizes meeting minutes.
 * - SummarizeMeetingMinutesInput - The input type for the summarizeMeetingMinutes function.
 * - SummarizeMeetingMinutesOutput - The return type for the summarizeMeetingMinutes function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeMeetingMinutesInputSchema = z.object({
  transcription: z.string().describe('The full transcription of the meeting.'),
});
export type SummarizeMeetingMinutesInput = z.infer<typeof SummarizeMeetingMinutesInputSchema>;

const SummarizeMeetingMinutesOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the meeting minutes, highlighting key decisions and action items.'),
});
export type SummarizeMeetingMinutesOutput = z.infer<typeof SummarizeMeetingMinutesOutputSchema>;

export async function summarizeMeetingMinutes(input: SummarizeMeetingMinutesInput): Promise<SummarizeMeetingMinutesOutput> {
  return summarizeMeetingMinutesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMeetingMinutesPrompt',
  input: {
    schema: z.object({
      transcription: z.string().describe('The full transcription of the meeting.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A concise summary of the meeting minutes, highlighting key decisions and action items.'),
    }),
  },
  prompt: `You are an AI assistant tasked with summarizing meeting minutes.
  Your goal is to provide a concise summary that highlights the key decisions and action items discussed during the meeting.
  Use the following transcription to create the summary:

  Transcription: {{{transcription}}}
  `,
});

const summarizeMeetingMinutesFlow = ai.defineFlow<
  typeof SummarizeMeetingMinutesInputSchema,
  typeof SummarizeMeetingMinutesOutputSchema
>({
  name: 'summarizeMeetingMinutesFlow',
  inputSchema: SummarizeMeetingMinutesInputSchema,
  outputSchema: SummarizeMeetingMinutesOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
