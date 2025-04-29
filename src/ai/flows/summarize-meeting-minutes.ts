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
  summary: z.string().describe('A concise summary of the meeting minutes in Japanese, in markdown format, highlighting key decisions and action items.'),
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
      summary: z.string().describe('会議の主要な決定事項とアクションアイテムを強調した、簡潔な日本語の要約。'), // Updated description
    }),
  },
  prompt: `あなたは議事録を要約するAIアシスタントです。
  あなたの目標は、会議中に議論された主要な決定事項とアクションアイテムを強調した簡潔な要約を**日本語で**提供することです。
  生成された要約は**マークダウン形式**で記述してください。\n
  以下の文字起こしを使用して要約を作成してください：

  文字起こし: {{{transcription}}}
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
