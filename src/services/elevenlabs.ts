import { ElevenLabsClient } from "elevenlabs";
import tmp from "./tmp.json";

const API_KEY = "";

const client = new ElevenLabsClient({ apiKey: API_KEY });

/**
 * Represents the result of a transcription, including the transcribed text.
 */
export interface TranscriptionResult {
  timeline: TimelineItem[];
}

/**
 * Asynchronously transcribes audio from a given file using ElevenLabs Scribe API.
 *
 * @param audioFile The audio file to transcribe.
 * @returns A promise that resolves to a TranscriptionResult object containing the transcribed text.
 */
export async function transcribeAudio(
  audioFile: File
): Promise<TranscriptionResult> {
  if (false) {
    const res = await client.speechToText.convert({
      model_id: "scribe_v1",
      file: audioFile,
      diarize: true,
    });
    console.log("Transcription result:", res);
  }

  const grouped = groupingBySpeaker(tmp as Word[]);

  return {
    timeline: grouped,
  };
}

type Response = Awaited<ReturnType<typeof client.speechToText.convert>>;
type Word = Response["words"][number];
export type TimelineItem = {
  speaker_id: string;
  text: string;
  start: number;
  end: number;
  words: Word[];
};
function groupingBySpeaker(words: Word[]): TimelineItem[] {
  const result: {
    speaker_id: string;
    text: string;
    start: number;
    end: number;
    words: Word[];
  }[] = [];

  for (const word of words) {
    if (result.length === 0 || result.at(-1)!.speaker_id !== word.speaker_id) {
      result.push({
        speaker_id: word.speaker_id!,
        text: "",
        start: 0,
        end: 0,
        words: [],
      });
    }
    const last = result.at(-1)!;
    last.words.push(word);
  }

  for (const el of result) {
    el.text = el.words.map((w) => w.text).join("");
    el.start = Math.min(...el.words.map((w) => w.start!));
    el.end = Math.max(...el.words.map((w) => w.end!));
  }

  return result;
}
