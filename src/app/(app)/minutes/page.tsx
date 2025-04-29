
"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { transcribeAudio, type TranscriptionResult, type TimelineItem as TimelineItemType } from '@/services/elevenlabs'; // Assuming this service exists
import { generateMeetingMinutes, summarizeMeetingMinutes } from '@/ai/flows'; // Assuming these flows exist
import { Upload, FileText, BrainCircuit, Search, Loader2, Mic } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { GenerateMeetingMinutesOutput } from '@/ai/flows/generate-meeting-minutes';
import type { SummarizeMeetingMinutesOutput } from '@/ai/flows/summarize-meeting-minutes';
import { Label } from '@/components/ui/label';

// Mock storage for minutes (replace with actual DB interaction)
interface MeetingMinute {
  id: string;
  title: string;
  date: Date;
  transcription: TimelineItemType[];
  minutes: string;
  summary: string;
}

const mockMinutes: MeetingMinute[] = [
  { id: '1', title: '2024年5月定例役員会', date: new Date(2024, 4, 15), transcription: [], minutes: '5月役員会議事録サンプル...', summary: '主要決定事項：夏祭りの日程決定。アクションアイテム：XXさんが提灯を手配。' },
  { id: '2', title: '夏祭り実行委員会 #1', date: new Date(2024, 5, 1), transcription: [], minutes: '夏祭り委員会議事録...', summary: '屋台の配置、ボランティア募集について議論。' },
];


export default function MinutesPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<TimelineItemType[] | null>(null);
  const [minutes, setMinutes] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [isLoadingMinutes, setIsLoadingMinutes] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false); // Added summary loading state
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedMinutes, setSavedMinutes] = useState<MeetingMinute[]>(mockMinutes); // Use mock data initially


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      // Reset previous results
      setTranscription(null);
      setMinutes(null);
      setSummary(null);
      setError(null);
    }
  };

  const handleTranscribe = useCallback(async () => {
    if (!audioFile) {
      setError("音声ファイルを選択してください。");
      return;
    }
    setIsLoadingTranscription(true);
    setError(null);
    setMinutes(null); // Reset minutes when transcribing again
    setSummary(null); // Reset summary

    try {
      const result: TranscriptionResult = await transcribeAudio(audioFile);
      setTranscription(result.timeline);
    } catch (err) {
      console.error("Transcription error:", err);
      setError("文字起こし中にエラーが発生しました。");
      setTranscription(null);
    } finally {
      setIsLoadingTranscription(false);
    }
  }, [audioFile]);

  const handleGenerateMinutes = useCallback(async () => {
    if (!transcription) {
      setError("文字起こし結果がありません。");
      return;
    }
    setIsLoadingMinutes(true);
    setError(null);
    setSummary(null); // Reset summary when generating new minutes

    try {
      // Combine transcription text for the AI flow
      const fullTranscriptionText = transcription.map(item => `${item.speaker_id}: ${item.text}`).join('\n');
      const result: GenerateMeetingMinutesOutput = await generateMeetingMinutes({ transcription: fullTranscriptionText });
      setMinutes(result.minutes);
    } catch (err) {
      console.error("Minutes generation error:", err);
      setError("議事録生成中にエラーが発生しました。");
      setMinutes(null);
    } finally {
      setIsLoadingMinutes(false);
    }
  }, [transcription]);

  const handleGenerateSummary = useCallback(async () => {
    if (!transcription) { // Using transcription as the source for summary as well
      setError("文字起こし結果がありません。");
      return;
    }
    setIsLoadingSummary(true);
    setError(null);

    try {
      // Combine transcription text for the AI flow
      const fullTranscriptionText = transcription.map(item => `${item.speaker_id}: ${item.text}`).join('\n');
      const result: SummarizeMeetingMinutesOutput = await summarizeMeetingMinutes({ transcription: fullTranscriptionText });
      setSummary(result.summary);
    } catch (err) {
      console.error("Summary generation error:", err);
      setError("要約生成中にエラーが発生しました。");
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [transcription]);

  // TODO: Implement save functionality (e.g., to Firestore)
  const handleSaveMinutes = () => {
    if (!transcription || !minutes || !summary || !audioFile) {
      setError("保存に必要な情報（文字起こし、議事録、要約、ファイル名）が不足しています。");
      return;
    }
    const newMinute: MeetingMinute = {
      id: Date.now().toString(), // Simple ID generation
      title: audioFile.name.replace(/\.[^/.]+$/, "") || `議事録 ${new Date().toLocaleDateString()}`, // Use file name as title or default
      date: new Date(),
      transcription: transcription,
      minutes: minutes,
      summary: summary,
    };
    setSavedMinutes(prev => [newMinute, ...prev]);
    // Reset state after saving
    setAudioFile(null);
    setTranscription(null);
    setMinutes(null);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
    console.log("議事録を保存しました:", newMinute); // Replace with actual save logic
  };


  const filteredMinutes = savedMinutes.filter(minute =>
    minute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    minute.minutes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    minute.transcription.some(item => item.text.toLowerCase().includes(searchTerm.toLowerCase())) || // Check transcription text
    minute.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">議事録管理</h1>

      {/* Section 1: Create New Minutes */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>新規議事録作成</CardTitle>
          <CardDescription>会議の音声ファイルをアップロードして、文字起こしと議事録を作成します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="audio-upload">1. 音声ファイルを選択</Label>
            <div className="flex items-center gap-4">
              <Input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="flex-grow"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                <Upload className="mr-2 h-4 w-4" /> ファイル選択
              </Button>
            </div>

            {audioFile && <p className="text-sm text-muted-foreground">選択中のファイル: {audioFile.name}</p>}
          </div>

          <Button onClick={handleTranscribe} disabled={!audioFile || isLoadingTranscription} className="w-full md:w-auto bg-primary hover:bg-primary/90">
            {isLoadingTranscription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
            2. 文字起こし開始
          </Button>

          {transcription && (
            <div className="space-y-4 pt-4">
              <Separator />
              <h3 className="font-semibold">文字起こし結果:</h3>
              <ScrollArea className="h-48 w-full rounded-md border p-4 bg-secondary/50">
                 <div className="space-y-2">
                   {transcription.map((item, index) => <TimelineItem key={`${item.speaker_id}-${item.start}-${index}`} item={item} />)}
                 </div>
              </ScrollArea>
              <div className="flex flex-col md:flex-row gap-4">
                <Button onClick={handleGenerateMinutes} disabled={isLoadingMinutes || isLoadingTranscription} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                  {isLoadingMinutes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  3. AIで議事録を作成
                </Button>
                <Button onClick={handleGenerateSummary} disabled={isLoadingSummary || isLoadingTranscription} variant="outline" className="flex-1">
                  {isLoadingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  AIで要約を作成
                </Button>
              </div>
            </div>
          )}

          {minutes && (
            <div className="space-y-4 pt-4">
              <Separator />
              <h3 className="font-semibold">生成された議事録:</h3>
              <Textarea value={minutes} readOnly rows={15} className="bg-secondary/50" />
            </div>
          )}

          {summary && (
            <div className="space-y-2 pt-4">
              <Separator />
              <h3 className="font-semibold">生成された要約:</h3>
              <Card className="bg-secondary/50 p-4">
                <p>{summary}</p>
              </Card>
            </div>
          )}

          {/* Save Button */}
          {transcription && minutes && summary && (
            <div className="pt-4">
              <Separator className="mb-4" />
              <Button onClick={handleSaveMinutes} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                <FileText className="mr-2 h-4 w-4" /> 議事録を保存
              </Button>
            </div>
          )}

        </CardContent>
      </Card>


      {/* Section 2: View Saved Minutes */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>保存済み議事録</CardTitle>
          <CardDescription>過去に作成・保存した議事録を検索・閲覧できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="議事録を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <ScrollArea className="h-96"> {/* Adjust height as needed */}
            <div className="space-y-4 pr-4">
              {filteredMinutes.length > 0 ? (
                filteredMinutes.map((minute) => (
                  <Card key={minute.id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{minute.title}</CardTitle>
                      <CardDescription>{minute.date.toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium mb-1">要約:</p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {minute.summary}
                      </p>
                      <details>
                        <summary className="text-sm text-primary cursor-pointer hover:underline">詳細表示</summary>
                        <div className="mt-2 space-y-4 text-sm">
                          <div>
                             <h4 className="font-semibold mb-1">議事録:</h4>
                             <pre className="whitespace-pre-wrap bg-secondary p-2 rounded text-xs font-mono">{minute.minutes}</pre>
                          </div>
                           {minute.transcription && minute.transcription.length > 0 && (
                             <div>
                                <h4 className="font-semibold mb-1">文字起こし:</h4>
                                <div className="space-y-2 bg-secondary p-2 rounded text-xs">
                                  {minute.transcription.map((item, index) => <TimelineItem key={`${item.speaker_id}-${item.start}-${index}`} item={item} />)}
                                </div>
                             </div>
                           )}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">該当する議事録が見つかりません。</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Utility to format seconds into MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

// Pre-define a larger set of speaker colors
const speakerColors: Record<string, string> = {
  speaker_0: 'text-blue-600 dark:text-blue-400',
  speaker_1: 'text-purple-600 dark:text-purple-400',
  speaker_2: 'text-orange-600 dark:text-orange-400',
  speaker_3: 'text-green-600 dark:text-green-400',
  speaker_4: 'text-red-600 dark:text-red-400',
  speaker_5: 'text-yellow-600 dark:text-yellow-400',
  speaker_6: 'text-pink-600 dark:text-pink-400',
  speaker_7: 'text-teal-600 dark:text-teal-400',
  speaker_8: 'text-cyan-600 dark:text-cyan-400',
  speaker_9: 'text-lime-600 dark:text-lime-400',
  speaker_10: 'text-indigo-600 dark:text-indigo-400',
  speaker_11: 'text-rose-600 dark:text-rose-400',
  speaker_12: 'text-amber-600 dark:text-amber-400',
  speaker_13: 'text-emerald-600 dark:text-emerald-400',
  speaker_14: 'text-sky-600 dark:text-sky-400',
  speaker_15: 'text-violet-600 dark:text-violet-400',
  speaker_16: 'text-fuchsia-600 dark:text-fuchsia-400',
  speaker_17: 'text-stone-600 dark:text-stone-400',
  speaker_18: 'text-zinc-600 dark:text-zinc-400',
  speaker_19: 'text-neutral-600 dark:text-neutral-400',
  speaker_20: 'text-slate-600 dark:text-slate-400',
  speaker_21: 'text-blue-500 dark:text-blue-300', // Slightly lighter variants
  speaker_22: 'text-purple-500 dark:text-purple-300',
  speaker_23: 'text-orange-500 dark:text-orange-300',
  speaker_24: 'text-green-500 dark:text-green-300',
  speaker_25: 'text-red-500 dark:text-red-300',
  speaker_26: 'text-yellow-500 dark:text-yellow-300',
  speaker_27: 'text-pink-500 dark:text-pink-300',
  speaker_28: 'text-teal-500 dark:text-teal-300',
  speaker_29: 'text-cyan-500 dark:text-cyan-300',
  speaker_30: 'text-lime-500 dark:text-lime-300',
  speaker_31: 'text-indigo-500 dark:text-indigo-300',
};


const TimelineItem = ({ item }: { item: TimelineItemType }) => {
   const speakerColor = speakerColors[item.speaker_id] || 'text-foreground'; // Default color if speaker ID > 31

  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="font-mono text-muted-foreground w-16 flex-shrink-0 text-right">
        [{formatTime(item.start)}-{formatTime(item.end)}]
      </span>
      <span className={`font-semibold w-20 flex-shrink-0 ${speakerColor}`}>
        {item.speaker_id || 'Unknown'}:
      </span>
      <p className="flex-grow text-foreground/90">{item.text}</p>
    </div>
  );
}
