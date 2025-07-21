import { logger } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ElevenLabsClient } from "elevenlabs";

// Secret definitions
const genAiApiKey = defineSecret("GEN_AI_API_KEY");
const elevenLabsApiKey = defineSecret("ELEVENLABS_API_KEY");


// --- Type Definitions ---

// For Gen AI functions
interface ScrumData {
    master: string;
    lastTimeActions: string;
    topics: string;
    progress: { name: string; updates: string }[];
    decisions: string;
    nextTimeActions: string;
    other: string;
}
interface GenerateMinutesRequest {
    scrum: ScrumData;
    members: string[];
}
interface GenerateMinutesResponse {
    minutes: string;
}
interface SummarizeMinutesRequest {
    minutes: string;
}
interface SummarizeMinutesResponse {
    summary: string;
}

// For ElevenLabs function
export type TimelineItem = {
  speaker: string;
  text: string;
  start: number;
  end: number;
};
interface TranscribeAudioRequest {
    audioBase64: string; // Audio file encoded as a Base64 string
}
interface TranscribeAudioResponse {
    timeline: TimelineItem[];
}


// --- Google Generative AI Cloud Functions ---

export const generateMeetingMinutes = onCall<GenerateMinutesRequest>({ secrets: [genAiApiKey] }, async (request): Promise<GenerateMinutesResponse> => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }
    // ... (rest of the function remains the same)
    const { scrum, members } = request.data;
    if (!scrum || !members) {
        throw new HttpsError("invalid-argument", "Missing 'scrum' or 'members' data.");
    }
    try {
        const genAI = new GoogleGenerativeAI(genAiApiKey.value());
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `以下の情報から、会議の議事録を生成してください。
# スクラムマスター: ${scrum.master}
# メンバー: ${members.join(", ")}
# 前回の持ち越しタスク: ${scrum.lastTimeActions}
# 今回の議題: ${scrum.topics}
# 各メンバーの進捗:
${scrum.progress.map((p) => `- ${p.name}: ${p.updates}`).join("\n")}
# 決定事項: ${scrum.decisions}
# 次回の持ち越しタスク: ${scrum.nextTimeActions}
# その他: ${scrum.other}`;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        logger.info("Generated meeting minutes successfully.");
        return { minutes: text };
    } catch (error) {
        logger.error("Error generating meeting minutes:", error);
        throw new HttpsError("internal", "Failed to generate meeting minutes.");
    }
});

export const summarizeMeetingMinutes = onCall<SummarizeMinutesRequest>({ secrets: [genAiApiKey] }, async (request): Promise<SummarizeMinutesResponse> => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }
    // ... (rest of the function remains the same)
    const { minutes } = request.data;
    if (!minutes) {
        throw new HttpsError("invalid-argument", "Missing 'minutes' data.");
    }
    try {
        const genAI = new GoogleGenerativeAI(genAiApiKey.value());
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `以下の議事録を要約してください:

${minutes}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        logger.info("Summarized meeting minutes successfully.");
        return { summary: text };
    } catch (error) {
        logger.error("Error summarizing meeting minutes:", error);
        throw new HttpsError("internal", "Failed to summarize meeting minutes.");
    }
});


// --- ElevenLabs Cloud Function ---

type ElevenLabsWord = {
  text: string;
  start?: number;
  end?: number;
  speaker_id?: string;
};

// Helper function to group words by speaker
function groupingBySpeaker(words: ElevenLabsWord[]): TimelineItem[] {
  const result: (TimelineItem & { words: ElevenLabsWord[] })[] = [];

  for (const word of words) {
    if (!word.speaker_id) continue;
    if (result.length === 0 || result.at(-1)!.speaker !== word.speaker_id) {
      result.push({
        speaker: word.speaker_id,
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
    el.start = Math.min(...el.words.map((w) => w.start ?? 0));
    el.end = Math.max(...el.words.map((w) => w.end ?? 0));
  }

  return result.map(({ speaker, text, start, end }) => ({ speaker, text, start, end }));
}

export const transcribeAudio = onCall<TranscribeAudioRequest>({ secrets: [elevenLabsApiKey], memory: "1GiB" }, async (request): Promise<TranscribeAudioResponse> => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }
    
    const { audioBase64 } = request.data;
    if (!audioBase64) {
        throw new HttpsError("invalid-argument", "Missing 'audioBase64' data.");
    }

    try {
        const client = new ElevenLabsClient({ apiKey: elevenLabsApiKey.value() });
        
        // Convert Base64 string back to a Buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        logger.info("Starting audio transcription with ElevenLabs...");
        const response = await client.speechToText.convert({
            model_id: "scribe_v1",
            file: new Blob([audioBuffer]),
            diarize: true,
        });
        logger.info("Transcription successful. Grouping words by speaker.");

        const timeline = groupingBySpeaker(response.words);
        
        return { timeline };

    } catch (error) {
        logger.error("Error during audio transcription:", error);
        throw new HttpsError("internal", "Failed to transcribe audio.");
    }
});
