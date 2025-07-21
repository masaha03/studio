
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { transcribeAudio, type TranscriptionResult, type TimelineItem as TimelineItemType } from '@/services/elevenlabs';
// Import from the new Cloud Functions wrapper
import { generateMeetingMinutes, summarizeMeetingMinutes } from '@/lib/firebase/gen-ai';
import { Upload, FileText, BrainCircuit, Search, Loader2, Mic, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { addMinute, deleteMinute, getMinutes, Minute, TranscriptEntry } from '@/lib/firebase/minutes';
import { Timestamp } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MinutesPage() {
  // State for the creation process
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<TimelineItemType[] | null>(null);
  const [minutes, setMinutes] = useState<string | null>(null); // Markdown string
  const [summary, setSummary] = useState<string | null>(null); // Markdown string
  
  // Loading states
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial data fetch

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // State for saved data
  const [savedMinutes, setSavedMinutes] = useState<Minute[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchMinutes = async () => {
      try {
        const minutesFromDb = await getMinutes();
        setSavedMinutes(minutesFromDb);
      } catch (err) {
        console.error(err);
        toast({ title: "エラー", description: "議事録の読み込みに失敗しました。", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMinutes();
  }, [toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
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
    setIsTranscribing(true);
    setError(null);
    setMinutes(null);
    setSummary(null);

    try {
      const result: TranscriptionResult = await transcribeAudio(audioFile);
      setTranscription(result.timeline);
    } catch (err) {
      console.error("Transcription error:", err);
      setError("文字起こし中にエラーが発生しました。");
      setTranscription(null);
    } finally {
      setIsTranscribing(false);
    }
  }, [audioFile]);

  const handleGenerateMinutes = useCallback(async () => {
    if (!transcription) {
      setError("文字起こし結果がありません。");
      return;
    }
    setIsGeneratingMinutes(true);
    setError(null);

    try {
      // The Cloud Function expects a scrum object and members array.
      // We will simulate this based on the transcription.
      // In a real scenario, you might have a form for this data.
      const scrumData = {
          master: "（不明）",
          lastTimeActions: "（不明）",
          topics: "音声ファイルからの文字起こしに基づく議事録",
          progress: transcription.map(t => ({ name: t.speaker, updates: t.text })),
          decisions: "（AIによる抽出）",
          nextTimeActions: "（AIによる抽出）",
          other: "",
      };
      const members = Array.from(new Set(transcription.map(t => t.speaker)));
      
      const resultMinutes = await generateMeetingMinutes(scrumData, members);
      setMinutes(resultMinutes);
    } catch (err) {
      console.error("Minutes generation error:", err);
      setError("議事録生成中にエラーが発生しました。");
      setMinutes(null);
    } finally {
      setIsGeneratingMinutes(false);
    }
  }, [transcription]);

  const handleGenerateSummary = useCallback(async () => {
    if (!minutes) { // Use generated minutes for summary
      setError("要約する議事録がありません。先に議事録を生成してください。");
      return;
    }
    setIsGeneratingSummary(true);
    setError(null);

    try {
      const resultSummary = await summarizeMeetingMinutes(minutes);
      setSummary(resultSummary);
    } catch (err) {
      console.error("Summary generation error:", err);
      setError("要約生成中にエラーが発生しました。");
      setSummary(null);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [minutes]);


  const handleSaveMinutes = async () => {
    if (!transcription || !minutes || !summary || !audioFile) {
      setError("保存に必要な情報（文字起こし、議事録、要約、ファイル名）が不足しています。");
      return;
    }
    setIsSaving(true);
    try {
      const newMinuteData: Omit<Minute, "id" | "uid" | "createdAt"> = {
        title: audioFile.name.replace(/\.[^/.]+$/, "") || `議事録 ${new Date().toLocaleDateString()}`,
        date: Timestamp.now(),
        summary,
        minutes,
        transcript: transcription.map(t => ({
          speaker: t.speaker,
          text: t.text,
          start: t.start,
          end: t.end,
        })),
        // audioUrl will be added in a future step
      };
      
      const newMinute = await addMinute(newMinuteData);
      setSavedMinutes(prev => [newMinute, ...prev]);
      
      toast({ title: "保存完了", description: "議事録を保存しました。" });
      // Reset form
      setAudioFile(null);
      setTranscription(null);
      setMinutes(null);
      setSummary(null);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error("Failed to save minute:", err);
      setError("議事録の保存に失敗しました。");
      toast({ title: "エラー", description: "議事録の保存に失敗しました。", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMinute = async (id: string) => {
    try {
      await deleteMinute(id);
      setSavedMinutes(prev => prev.filter(m => m.id !== id));
      toast({ title: "削除完了", description: "議事録を削除しました。", variant: "default" });
    } catch (err) {
      console.error("Failed to delete minute:", err);
      toast({ title: "エラー", description: "議事録の削除に失敗しました。", variant: "destructive" });
    }
  }

  const filteredMinutes = savedMinutes.filter(minute =>
    minute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    minute.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    minute.transcript.some(item => item.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">議事録管理</h1>

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
                disabled={isTranscribing || isGeneratingMinutes || isGeneratingSummary || isSaving}
              />
            </div>
            {audioFile && <p className="text-sm text-muted-foreground">選択中のファイル: {audioFile.name}</p>}
          </div>

          <Button onClick={handleTranscribe} disabled={!audioFile || isTranscribing} className="w-full md:w-auto bg-primary hover:bg-primary/90">
            {isTranscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
            2. 文字起こし開始
          </Button>

          {transcription && (
            <div className="space-y-4 pt-4">
              <Separator />
              <h3 className="font-semibold">文字起こし結果:</h3>
              <ScrollArea className="h-48 w-full rounded-md border p-4 bg-secondary/50">
                 <div className="space-y-2">
                   {transcription.map((item, index) => <TimelineItem key={`${item.speaker}-${item.start}-${index}`} item={item} />)}
                 </div>
              </ScrollArea>
              <div className="flex flex-col md:flex-row gap-4">
                <Button onClick={handleGenerateMinutes} disabled={isGeneratingMinutes || isTranscribing} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                  {isGeneratingMinutes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  3. AIで議事録を作成
                </Button>
                <Button onClick={handleGenerateSummary} disabled={!minutes || isGeneratingSummary || isTranscribing} variant="outline" className="flex-1">
                  {isGeneratingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  AIで要約を作成
                </Button>
              </div>
            </div>
          )}

          {minutes && (
            <div className="space-y-4 pt-4">
              <Separator />
              <h3 className="font-semibold">生成された議事録:</h3>
              <Card className="prose prose-sm dark:prose-invert max-w-none p-4 border bg-secondary/50 rounded-md overflow-auto max-h-96">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{minutes}</ReactMarkdown>
              </Card>
            </div>
          )}

          {summary && (
            <div className="space-y-2 pt-4">
              <Separator />
              <h3 className="font-semibold">生成された要約:</h3>
              <Card className="prose prose-sm dark:prose-invert max-w-none p-4 border bg-secondary/50 rounded-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              </Card>
            </div>
          )}

          {transcription && minutes && summary && (
            <div className="pt-4">
              <Separator className="mb-4" />
              <Button onClick={handleSaveMinutes} disabled={isSaving} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                 {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                 議事録を保存
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


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

          <ScrollArea className="h-96">
            <div className="space-y-4 pr-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : filteredMinutes.length > 0 ? (
                filteredMinutes.map((minute) => (
                  <Card key={minute.id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                        <div>
                            <CardTitle className="text-base">{minute.title}</CardTitle>
                            <CardDescription>{minute.date.toDate().toLocaleDateString()}</CardDescription>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                    議事録「{minute.title}」を削除します。この操作は元に戻せません。
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction onClick={() => minute.id && handleDeleteMinute(minute.id)} className="bg-destructive hover:bg-destructive/90">削除</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium mb-1">要約:</div>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground line-clamp-2 mb-3">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{minute.summary}</ReactMarkdown>
                      </div>
                      <details>
                        <summary className="text-sm text-primary cursor-pointer hover:underline">詳細表示</summary>
                        <div className="mt-2 space-y-4 text-sm">
                          <div>
                             <h4 className="font-semibold mb-1">議事録:</h4>
                             <div className="prose prose-sm dark:prose-invert max-w-none bg-secondary p-2 rounded text-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{minute.minutes}</ReactMarkdown>
                             </div>
                          </div>
                           {minute.transcript && minute.transcript.length > 0 && (
                             <div>
                                <h4 className="font-semibold mb-1">文字起こし:</h4>
                                <div className="space-y-2 bg-secondary p-2 rounded text-xs max-h-60 overflow-y-auto">
                                  {minute.transcript.map((item, index) => <TranscriptItem key={`${item.speaker}-${index}`} item={item} />)}
                                </div>
                             </div>
                           )}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                  {searchTerm ? "該当する議事録が見つかりません。" : "保存されている議事録はありません。"}
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const speakerColors: Record<string, string> = {
  speaker_0: 'text-blue-600 dark:text-blue-400', speaker_1: 'text-purple-600 dark:text-purple-400', speaker_2: 'text-orange-600 dark:text-orange-400',
  speaker_3: 'text-green-600 dark:text-green-400', speaker_4: 'text-red-600 dark:text-red-400',
};

const TimelineItem = ({ item }: { item: TimelineItemType }) => {
   const speakerColor = speakerColors[item.speaker] || 'text-foreground';
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="font-mono text-muted-foreground w-16 flex-shrink-0 text-right">
        [{formatTime(item.start)}-{formatTime(item.end)}]
      </span>
      <span className={`font-semibold w-20 flex-shrink-0 ${speakerColor}`}>
        {item.speaker || 'Unknown'}:
      </span>
      <p className="flex-grow text-foreground/90">{item.text}</p>
    </div>
  );
}

const TranscriptItem = ({ item }: { item: TranscriptEntry }) => {
  const speakerColor = speakerColors[item.speaker] || 'text-foreground';
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={`font-semibold w-20 flex-shrink-0 ${speakerColor}`}>
        {item.speaker || 'Unknown'}:
      </span>
      <p className="flex-grow text-foreground/90">{item.text}</p>
    </div>
  );
}
