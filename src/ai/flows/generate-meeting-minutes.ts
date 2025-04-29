'use server';

/**
 * @fileOverview Generates meeting minutes from a transcription using AI.
 *
 * - generateMeetingMinutes - A function to generate meeting minutes.
 * - GenerateMeetingMinutesInput - The input type for the generateMeetingMinutes function.
 * - GenerateMeetingMinutesOutput - The output type for the generateMeetingMinutes function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateMeetingMinutesInputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcription of the meeting.'),
});
export type GenerateMeetingMinutesInput = z.infer<typeof GenerateMeetingMinutesInputSchema>;

const GenerateMeetingMinutesOutputSchema = z.object({
  minutes: z.string().describe('The generated meeting minutes.'),
});
export type GenerateMeetingMinutesOutput = z.infer<typeof GenerateMeetingMinutesOutputSchema>;

export async function generateMeetingMinutes(input: GenerateMeetingMinutesInput): Promise<GenerateMeetingMinutesOutput> {
  return generateMeetingMinutesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMeetingMinutesPrompt',
  input: {
    schema: z.object({
      transcription: z
        .string()
        .describe('The transcription of the meeting.'),
    }),
  },
  output: {
    schema: z.object({
      minutes: z.string().describe('The generated meeting minutes.'),
    }),
  },
  prompt: `You are an AI expert in generating concise and informative meeting minutes from a given transcription.

  Given the following meeting transcription, generate a set of meeting minutes summarizing the key discussion points, decisions, and action items.

  Transcription: {{{transcription}}}
  `,
});

const generateMeetingMinutesFlow = ai.defineFlow<
  typeof GenerateMeetingMinutesInputSchema,
  typeof GenerateMeetingMinutesOutputSchema
>({
  name: 'generateMeetingMinutesFlow',
  inputSchema: GenerateMeetingMinutesInputSchema,
  outputSchema: GenerateMeetingMinutesOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
