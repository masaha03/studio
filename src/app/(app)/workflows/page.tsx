
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, PlusCircle, Edit, Trash2, AlertCircle, File as FileIcon, Save, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { addWorkflow, deleteWorkflow, getWorkflows, updateWorkflow, Workflow, WorkflowFile } from '@/lib/firebase/workflows';
import { Skeleton } from '@/components/ui/skeleton';


// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
   flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
    },
});

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Add Modal State
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [newWorkflowMermaidCode, setNewWorkflowMermaidCode] = useState(`graph TD
    A[ステップ1] --> B[ステップ2];`);

  const mermaidRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedWorkflow = workflows.find(wf => wf.id === selectedWorkflowId);

  // Fetch workflows from firestore
  useEffect(() => {
    const fetchWorkflows = async () => {
      setIsLoading(true);
      try {
        const fetchedWorkflows = await getWorkflows();
        setWorkflows(fetchedWorkflows);
        if (fetchedWorkflows.length > 0) {
          setSelectedWorkflowId(fetchedWorkflows[0].id!);
        }
      } catch (error) {
        console.error("Failed to fetch workflows:", error);
        toast({
          title: "エラー",
          description: "ワークフローの読み込みに失敗しました。",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkflows();
  }, [toast]);


  // Function to render Mermaid diagram
  const renderMermaid = useCallback(() => {
    if (mermaidRef.current && selectedWorkflow?.mermaidCode) {
       mermaidRef.current.innerHTML = '';
       try {
         mermaid.render('mermaid-graph', selectedWorkflow.mermaidCode)
           .then(({ svg }) => {
             if (mermaidRef.current) {
               mermaidRef.current.innerHTML = svg;
             }
           })
           .catch(e => {
             console.error("Mermaid rendering error:", e);
             if (mermaidRef.current) {
               mermaidRef.current.innerHTML = `<pre class="text-destructive bg-destructive/10 p-2 rounded">Mermaid描画エラー:
${e.message || e}</pre>`;
             }
           });
       } catch (e: any) {
         console.error("Mermaid rendering failed:", e);
          if (mermaidRef.current) {
             mermaidRef.current.innerHTML = `<pre class="text-destructive bg-destructive/10 p-2 rounded">Mermaid描画エラー:
${e.message || e}</pre>`;
           }
       }
     } else if (mermaidRef.current) {
       mermaidRef.current.innerHTML = '<p class="text-muted-foreground text-center py-8">ワークフローを選択するか、新規作成してください。</p>';
     }
   }, [selectedWorkflow]);


  useEffect(() => {
    renderMermaid();
  }, [selectedWorkflowId, selectedWorkflow?.mermaidCode, renderMermaid]);

   const handleAddWorkflow = async () => {
      if (!newWorkflowName.trim()) {
        toast({ title: "エラー", description: "ワークフロー名は必須です。", variant: "destructive" });
        return;
      }
      setIsSubmitting(true);
      try {
        const newWorkflowData = {
          name: newWorkflowName.trim(),
          description: newWorkflowDescription.trim() || '',
          mermaidCode: newWorkflowMermaidCode.trim(),
        };
        const newWorkflow = await addWorkflow(newWorkflowData);
        setWorkflows(prev => [...prev, newWorkflow]);
        setSelectedWorkflowId(newWorkflow.id!);
        toast({ title: "追加完了", description: `ワークフロー「${newWorkflow.name}」を追加しました。` });
        setIsAddModalOpen(false);
        // Reset add form
        setNewWorkflowName('');
        setNewWorkflowDescription('');
        setNewWorkflowMermaidCode(`graph TD
    A[ステップ1] --> B[ステップ2];`);
      } catch (error) {
        console.error("Failed to add workflow:", error);
        toast({ title: "エラー", description: "ワークフローの追加に失敗しました。", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    };

   const handleEditWorkflow = (workflow: Workflow) => {
      setEditingWorkflow(workflow);
      setIsEditModalOpen(true);
    };

   const handleSaveEdit = async () => {
     if (!editingWorkflow || !editingWorkflow.name.trim()) {
       toast({ title: "エラー", description: "ワークフロー名は必須です。", variant: "destructive" });
       return;
     }
     setIsSubmitting(true);
     try {
        const { id, uid, createdAt, ...updateData } = editingWorkflow;
        await updateWorkflow(id!, updateData);
        setWorkflows(prev => prev.map(wf => wf.id === id ? editingWorkflow : wf));
        toast({ title: "更新完了", description: `ワークフロー「${editingWorkflow.name}」を更新しました。` });
        setIsEditModalOpen(false);
        setEditingWorkflow(null);
     } catch (error) {
       console.error("Failed to update workflow:", error);
       toast({ title: "エラー", description: "ワークフローの更新に失敗しました。", variant: "destructive" });
     } finally {
        setIsSubmitting(false);
     }
   };

   const handleDeleteWorkflow = async (id: string) => {
     const workflowToDelete = workflows.find(wf => wf.id === id);
     if (!workflowToDelete) return;

     try {
       await deleteWorkflow(id);
       setWorkflows(prev => {
          const newWorkflows = prev.filter(wf => wf.id !== id);
          if (selectedWorkflowId === id) {
            setSelectedWorkflowId(newWorkflows.length > 0 ? newWorkflows[0].id! : null);
          }
          return newWorkflows;
       });
       toast({ title: "削除完了", description: `ワークフロー「${workflowToDelete.name}」を削除しました。` });
     } catch (error) {
       console.error("Failed to delete workflow:", error);
       toast({ title: "エラー", description: "ワークフローの削除に失敗しました。", variant: "destructive" });
     }
   };

    // TODO: Implement file upload to Firebase Storage
   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && selectedWorkflow) {
         toast({ title: "機能未実装", description: "ファイルアップロード機能は現在開発中です。", variant: "default" });
         console.log(`File "${file.name}" selected. Upload logic to be implemented.`);
         if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    // TODO: Implement file deletion from Firebase Storage
    const handleDeleteFile = (fileId: string) => {
       if (!editingWorkflow) return;
        toast({ title: "機能未実装", description: "ファイル削除機能は現在開発中です。", variant: "default" });
     };


  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-1 h-48" />
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="lg:col-span-3 h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h1 className="text-3xl font-bold text-primary">ワークフロー管理</h1>
         <Button onClick={() => setIsAddModalOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
           <PlusCircle className="mr-2 h-4 w-4" /> 新規ワークフロー作成
         </Button>
      </div>

       {workflows.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
             <h2 className="text-xl font-semibold text-muted-foreground">ワークフローがありません</h2>
             <p className="mt-2 text-sm text-muted-foreground">最初のワークフローを作成しましょう。</p>
             <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> 新規作成
             </Button>
          </div>
        ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Selection and Details */}
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>ワークフロー選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={setSelectedWorkflowId} value={selectedWorkflowId || ''}>
              <SelectTrigger>
                <SelectValue placeholder="ワークフローを選択..." />
              </SelectTrigger>
              <SelectContent>
                {workflows.map(wf => (
                  <SelectItem key={wf.id} value={wf.id!}>
                    {wf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {selectedWorkflow && (
                <div className="space-y-3 pt-4 border-t">
                   <h3 className="font-semibold text-lg">{selectedWorkflow.name}</h3>
                    {selectedWorkflow.description && (
                        <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditWorkflow(selectedWorkflow)}>
                        <Edit className="mr-2 h-4 w-4" /> 編集
                      </Button>
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm">
                             <Trash2 className="mr-2 h-4 w-4" /> 削除
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>
                               <AlertCircle className="inline-block mr-2 h-5 w-5 text-destructive" />
                               削除確認
                              </AlertDialogTitle>
                             <AlertDialogDescription>
                               ワークフロー「{selectedWorkflow.name}」を本当に削除しますか？この操作は元に戻せません。
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>キャンセル</AlertDialogCancel>
                             <AlertDialogAction
                               onClick={() => handleDeleteWorkflow(selectedWorkflow.id!)}
                               className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                             >
                               削除する
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                    </div>
                </div>
             )}
          </CardContent>
        </Card>

        {/* Mermaid Diagram Display */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>フロー図</CardTitle>
            <CardDescription>選択されたワークフローの図示。</CardDescription>
          </CardHeader>
          <CardContent>
             <div ref={mermaidRef} className="mermaid-container w-full overflow-auto p-4 border rounded-md bg-muted/20 min-h-[300px] flex items-center justify-center">
               {!selectedWorkflow && <p className="text-muted-foreground">ワークフローを選択してください。</p>}
            </div>
          </CardContent>
        </Card>

        {/* Associated Files */}
        {selectedWorkflow && (
           <Card className="lg:col-span-3 shadow-md">
             <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle>関連ファイル</CardTitle>
                  <CardDescription>このワークフローに関連するファイル。（現在開発中）</CardDescription>
               </div>
               <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> ファイルを追加
               </Button>
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
             </CardHeader>
             <CardContent>
               {selectedWorkflow.files.length > 0 ? (
                 <ul className="space-y-2">
                   {selectedWorkflow.files.map(file => (
                     <li key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                       <div className="flex items-center gap-2">
                         <FileIcon className="h-4 w-4 text-muted-foreground" />
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-primary">
                            {file.name}
                          </a>
                       </div>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-center text-muted-foreground py-4">関連ファイルはありません。</p>
               )}
             </CardContent>
           </Card>
        )}
      </div>
      )}

       {/* Add Workflow Modal */}
       <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
         <DialogContent className="sm:max-w-[600px]">
           <DialogHeader>
             <DialogTitle>新規ワークフロー作成</DialogTitle>
             <DialogDescription>新しいワークフローの名前、説明、Mermaidコードを入力してください。</DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="space-y-1">
               <Label htmlFor="new-wf-name">ワークフロー名 <span className="text-destructive">*</span></Label>
               <Input id="new-wf-name" value={newWorkflowName} onChange={(e) => setNewWorkflowName(e.target.value)} />
             </div>
              <div className="space-y-1">
               <Label htmlFor="new-wf-desc">説明 (任意)</Label>
               <Input id="new-wf-desc" value={newWorkflowDescription} onChange={(e) => setNewWorkflowDescription(e.target.value)} />
             </div>
             <div className="space-y-1">
               <Label htmlFor="new-wf-code">Mermaidコード <span className="text-destructive">*</span></Label>
               <Textarea
                 id="new-wf-code"
                 value={newWorkflowMermaidCode}
                 onChange={(e) => setNewWorkflowMermaidCode(e.target.value)}
                 rows={10}
                 placeholder={`例:
graph TD
    A[開始] --> B(処理1);
    B --> C{条件?};
    C -->|はい| D[処理2];
    C -->|いいえ| E[終了];
    D --> E;`}
                 className="font-mono text-sm"
               />
               <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary underline">Mermaid構文ヘルプ</a>
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>キャンセル</Button></DialogClose>
             <Button onClick={handleAddWorkflow} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                作成
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>


       {/* Edit Workflow Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>ワークフロー編集</DialogTitle>
              <DialogDescription>ワークフローの詳細を編集します。</DialogDescription>
            </DialogHeader>
            {editingWorkflow && (
               <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                 <div className="space-y-1">
                   <Label htmlFor="edit-wf-name">ワークフロー名 <span className="text-destructive">*</span></Label>
                   <Input id="edit-wf-name" value={editingWorkflow.name} onChange={(e) => setEditingWorkflow({...editingWorkflow, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="edit-wf-desc">説明 (任意)</Label>
                   <Input id="edit-wf-desc" value={editingWorkflow.description || ''} onChange={(e) => setEditingWorkflow({...editingWorkflow, description: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="edit-wf-code">Mermaidコード <span className="text-destructive">*</span></Label>
                   <Textarea
                     id="edit-wf-code"
                     value={editingWorkflow.mermaidCode}
                     onChange={(e) => setEditingWorkflow({...editingWorkflow, mermaidCode: e.target.value})}
                     rows={10}
                     className="font-mono text-sm"
                   />
                    <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary underline">Mermaid構文ヘルプ</a>
                 </div>
                  <div className="space-y-2 pt-4 border-t">
                     <Label>関連ファイル（開発中）</Label>
                     {editingWorkflow.files.length > 0 ? (
                        <ul className="space-y-2">
                          {editingWorkflow.files.map(file => (
                            <li key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30 text-sm">
                               <div className="flex items-center gap-2 overflow-hidden mr-2">
                                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate" title={file.name}>{file.name}</span>
                               </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10 flex-shrink-0" disabled>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </AlertDialog>
                            </li>
                          ))}
                        </ul>
                      ) : (
                         <p className="text-sm text-muted-foreground text-center py-2">ファイルはありません。</p>
                      )}
                     <Button size="sm" variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                       <Upload className="mr-2 h-4 w-4" /> ファイルを追加
                     </Button>
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
                  </div>
               </div>
             )}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>キャンセル</Button></DialogClose>
              <Button onClick={handleSaveEdit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> 保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
