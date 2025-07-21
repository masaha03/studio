import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/client";
import type { TimelineItem } from "@/lib/firebase/gen-ai"; // Import shared type from gen-ai

// --- Type Definitions ---

/**
 * Represents the result of a transcription from the Cloud Function.
 * This should match the response structure of the `transcribeAudio` Cloud Function.
 */
export interface TranscriptionResult {
  timeline: TimelineItem[];
}

// --- Helper Function ---

/**
 * Converts a File object into a Base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the Base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Result is a Data URL (e.g., "data:audio/mpeg;base64,..."). We only need the Base64 part.
      const encoded = reader.result?.toString().split(',')[1];
      if (encoded) {
        resolve(encoded);
      } else {
        reject(new Error("Failed to convert file to Base64."));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// --- Cloud Function Caller ---

const functions = getFunctions(app);
const callTranscribeAudio = httpsCallable<{ audioBase64: string }, TranscriptionResult>(functions, 'transcribeAudio');

/**
 * Asynchronously transcribes audio from a given file by calling a Cloud Function.
 *
 * @param audioFile The audio file to transcribe.
 * @returns A promise that resolves to a TranscriptionResult object.
 */
export async function transcribeAudio(
  audioFile: File
): Promise<TranscriptionResult> {
  try {
    // 1. Convert the audio file to a Base64 string.
    const audioBase64 = await fileToBase64(audioFile);

    // 2. Call the Cloud Function with the Base64 string.
    console.log("Calling transcribeAudio Cloud Function...");
    const result = await callTranscribeAudio({ audioBase64 });
    
    console.log("Transcription result from Cloud Function:", result.data);
    return result.data;
    
  } catch (error) {
    console.error("Error calling transcribeAudio Cloud Function:", error);
    // It's a good practice to throw the error again or handle it as needed.
    throw new Error("Failed to transcribe audio via Cloud Function.");
  }
}
