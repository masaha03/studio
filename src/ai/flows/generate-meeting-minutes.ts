"use server";

/**
 * @fileOverview Generates meeting minutes from a transcription using AI.
 *
 * - generateMeetingMinutes - A function to generate meeting minutes.
 * - GenerateMeetingMinutesInput - The input type for the generateMeetingMinutes function.
 * - GenerateMeetingMinutesOutput - The output type for the generateMeetingMinutes function.
 */

import { ai } from "@/ai/ai-instance";
import { z } from "genkit";

const GenerateMeetingMinutesInputSchema = z.object({
  transcription: z.string().describe("The transcription of the meeting."),
});
export type GenerateMeetingMinutesInput = z.infer<
  typeof GenerateMeetingMinutesInputSchema
>;

const GenerateMeetingMinutesOutputSchema = z.object({
  minutes: z
    .string()
    .describe("The generated meeting minutes in Japanese in markdown format."),
});
export type GenerateMeetingMinutesOutput = z.infer<
  typeof GenerateMeetingMinutesOutputSchema
>;

export async function generateMeetingMinutes(
  input: GenerateMeetingMinutesInput
): Promise<GenerateMeetingMinutesOutput> {
  return generateMeetingMinutesFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateMeetingMinutesPrompt",
  input: {
    schema: z.object({
      transcription: z.string().describe("The transcription of the meeting."),
    }),
  },
  output: {
    schema: z.object({
      minutes: z.string().describe("生成された日本語の議事録(マークダウン形式)。"), // Updated description
    }),
  },
  prompt: `あなたは、与えられた文字起こしから簡潔で有益な議事録を作成するAIエキスパートです。\n
  生成された議事録は**マークダウン形式**で記述してください。\n
  以下の会議の文字起こしから、主要な議題、決定事項、アクションアイテムを要約した議事録を**日本語で**生成してください。\n


  文字起こし: {{{transcription}}}
  `,
});

const generateMeetingMinutesFlow = ai.defineFlow<
  typeof GenerateMeetingMinutesInputSchema,
  typeof GenerateMeetingMinutesOutputSchema
>(
  {
    name: "generateMeetingMinutesFlow",
    inputSchema: GenerateMeetingMinutesInputSchema,
    outputSchema: GenerateMeetingMinutesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
