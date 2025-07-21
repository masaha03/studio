import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./client";

// Firebase Functionsのインスタンスを取得
const functions = getFunctions(app);

// generateMeetingMinutes Cloud Functionを呼び出す
const generateMinutes = httpsCallable(functions, 'generateMeetingMinutes');

// summarizeMeetingMinutes Cloud Functionを呼び出す
const summarizeMinutes = httpsCallable(functions, 'summarizeMeetingMinutes');

/**
 * サーバーサイドのAI機能（議事録生成）を呼び出します。
 * @param scrum - スクラムの議題や決定事項などの情報
 * @param members -参加メンバーのリスト
 * @returns 生成された議事録のテキスト
 */
export const generateMeetingMinutes = async (scrum: any, members: string[]): Promise<string> => {
  try {
    const result = await generateMinutes({ scrum, members });
    const data = result.data as { minutes: string };
    return data.minutes;
  } catch (error) {
    console.error("Error calling generateMeetingMinutes function:", error);
    throw new Error("Failed to generate meeting minutes.");
  }
};

/**
 * サーバーサイドのAI機能（議事録要約）を呼び出します。
 * @param minutes - 要約対象の議事録テキスト
 * @returns 要約されたテキスト
 */
export const summarizeMeetingMinutes = async (minutes: string): Promise<string> => {
  try {
    const result = await summarizeMinutes({ minutes });
    const data = result.data as { summary: string };
    return data.summary;
  } catch (error) {
    console.error("Error calling summarizeMeetingMinutes function:", error);
    throw new Error("Failed to summarize meeting minutes.");
  }
};

export type TimelineItem = {
  speaker: string;
  text: string;
  start: number;
  end: number;
};