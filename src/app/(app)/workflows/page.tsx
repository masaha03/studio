
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, PlusCircle, Edit, Trash2, AlertCircle, File as FileIcon, Save } from 'lucide-react';
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface WorkflowFile {
  id: string;
  name: string;
  url?: string; // Optional: URL if stored in cloud storage
  file?: File; // Temporary storage for new uploads
}

interface Workflow {
  id: string;
  name: string;
  mermaidCode: string;
  description?: string;
  files: WorkflowFile[];
}

// Mock Data - Replace with Firestore
const initialWorkflows: Workflow[] = [
  {
    id: '1',
    name: '会費集金フロー',
    description: '年会費の集金手順を図示します。',
    mermaidCode: `graph TD
    A[集金案内配布] --> B{集金期間};
    B --> |集金完了| C[会計へ入金];
    B --> |未納者| D[督促状送付];
    D --> B;
    C --> E[完了];
    `,
    files: [{ id: 'f1', name: '集金案内状テンプレート.docx' }],
  },
  {
    id: '2',
    name: '新役員選出フロー',
    mermaidCode: `graph LR
    A[候補者募集] --> B(推薦受付);
    B --> C{役員会承認};
    C --> |承認| D[総会へ上程];
    C --> |否決| A;
    D --> E((選出完了));
    `,
    files: [],
  },
];

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral', // or 'default', 'dark', 'forest'
   flowchart: {
      useMaxWidth: false, // Allow diagram to take full width if needed
      htmlLabels: true,
    },
   themeVariables: {
      // Example: customize colors - align with Tailwind theme if possible
      // primaryColor: '#3498db', // Blue
      // nodeBorder: '#3498db',
      // lineTextColor: '#333',
      // primaryTextColor: '#fff',
      // ... more variables
   }
});

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(initialWorkflows[0]?.id || null);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [newWorkflowMermaidCode, setNewWorkflowMermaidCode] = useState('graph TD\n    A[ステップ1] --> B[ステップ2];');
  const mermaidRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedWorkflow = workflows.find(wf => wf.id === selectedWorkflowId);

  // Function to render Mermaid diagram
  const renderMermaid = useCallback(() => {
    if (mermaidRef.current && selectedWorkflow?.mermaidCode) {
       // Clear previous render to avoid duplicates/errors
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
               mermaidRef.current.innerHTML = `<pre class="text-destructive bg-destructive/10 p-2 rounded">Mermaid描画エラー:\n${e.message || e}</pre>`;
             }
              toast({ title: "描画エラー", description: "Mermaidコードに誤りがある可能性があります。", variant: "destructive" });
           });
       } catch (e: any) {
         console.error("Mermaid rendering failed:", e);
          if (mermaidRef.current) {
             mermaidRef.current.innerHTML = `<pre class="text-destructive bg-destructive/10 p-2 rounded">Mermaid描画エラー:\n${e.message || e}</pre>`;
           }
         toast({ title: "描画エラー", description: "Mermaidコードを確認してください。", variant: "destructive" });
       }
     } else if (mermaidRef.current) {
       mermaidRef.current.innerHTML = '<p class="text-muted-foreground text-center py-8">ワークフローを選択するか、新規作成してください。</p>';
     }
   }, [selectedWorkflow, toast]);


  useEffect(() => {
    renderMermaid();
  }, [selectedWorkflowId, selectedWorkflow?.mermaidCode, renderMermaid]); // Rerender when selection or code changes

   const handleAddWorkflow = () => {
      if (!newWorkflowName.trim()) {
        toast({ title: "エラー", description: "ワークフロー名は必須です。", variant: "destructive" });
        return;
      }
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name: newWorkflowName.trim(),
        description: newWorkflowDescription.trim() || undefined,
        mermaidCode: newWorkflowMermaidCode.trim(),
        files: [],
      };
      setWorkflows(prev => [...prev, newWorkflow]);
      setSelectedWorkflowId(newWorkflow.id); // Select the newly added workflow
      // TODO: Save to Firestore
      toast({ title: "追加完了", description: `ワークフロー「${newWorkflow.name}」を追加しました。` });
      setIsAddModalOpen(false);
      // Reset add form
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      setNewWorkflowMermaidCode('graph TD\n    A[ステップ1] --> B[ステップ2];');
    };

   const handleEditWorkflow = (workflow: Workflow) => {
      setEditingWorkflow(workflow);
      setIsEditModalOpen(true);
    };

   const handleSaveEdit = () => {
     if (!editingWorkflow || !editingWorkflow.name.trim()) {
       toast({ title: "エラー", description: "ワークフロー名は必須です。", variant: "destructive" });
       return;
     }
      if (!editingWorkflow.mermaidCode.trim()) {
       toast({ title: "エラー", description: "Mermaidコードは必須です。", variant: "destructive" });
       return;
     }

     setWorkflows(prev => prev.map(wf => wf.id === editingWorkflow.id ? editingWorkflow : wf));
     // TODO: Update in Firestore
     toast({ title: "更新完了", description: `ワークフロー「${editingWorkflow.name}」を更新しました。` });
     setIsEditModalOpen(false);
     setEditingWorkflow(null); // Clear editing state
      // Force re-render if the selected workflow was edited
     if(selectedWorkflowId === editingWorkflow.id) {
        // Trigger re-render by slightly modifying state if needed, or rely on useEffect dependency
        renderMermaid();
     }
   };

   const handleDeleteWorkflow = (id: string) => {
     const workflowToDelete = workflows.find(wf => wf.id === id);
     if (!workflowToDelete) return;

     setWorkflows(prev => prev.filter(wf => wf.id !== id));
     if (selectedWorkflowId === id) {
       setSelectedWorkflowId(workflows[0]?.id || null); // Select the first workflow or null
     }
     // TODO: Delete from Firestore (including associated files if stored there)
     toast({ title: "削除完了", description: `ワークフロー「${workflowToDelete.name}」を削除しました。` });
   };

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && selectedWorkflow) {
        const newFile: WorkflowFile = {
          id: `temp-${Date.now()}`, // Temporary ID for UI
          name: file.name,
          file: file, // Store the actual file object temporarily
        };
         // Add the file to the currently selected workflow's files list
         setWorkflows(prev => prev.map(wf =>
             wf.id === selectedWorkflow.id
               ? { ...wf, files: [...wf.files, newFile] }
               : wf
           ));
         // TODO: Upload file to Firebase Storage and update the workflow document with the file URL
         // After successful upload, replace the temp file object with the URL and persistent ID
         console.log(`File "${file.name}" selected for workflow "${selectedWorkflow.name}". Upload logic needed.`);
         toast({ title: "ファイル選択", description: `${file.name} を追加しました。保存するにはワークフローを更新してください。` });

         // Clear the file input for next selection
         if(fileInputRef.current) fileInputRef.current.value = '';

         // If edit modal isn't open, open it to prompt save
         if(!isEditModalOpen && selectedWorkflow){
            handleEditWorkflow({ ...selectedWorkflow, files: [...selectedWorkflow.files, newFile] });
         } else if (isEditModalOpen && editingWorkflow){
            // If modal is already open, update the editing state directly
             setEditingWorkflow(prev => prev ? { ...prev, files: [...prev.files, newFile] } : null);
         }
      }
    };

    const handleDeleteFile = (fileId: string) => {
       if (!editingWorkflow) return; // Should only delete while editing

       setEditingWorkflow(prev => {
         if (!prev) return null;
         const updatedFiles = prev.files.filter(f => f.id !== fileId);
         return { ...prev, files: updatedFiles };
       });
       // TODO: Delete file from Firebase Storage if it's already uploaded
       toast({ title: "ファイル削除", description: "ファイルをリストから削除しました。変更を保存してください。" });
     };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h1 className="text-3xl font-bold text-primary">ワークフロー管理</h1>
         <Button onClick={() => setIsAddModalOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
           <PlusCircle className="mr-2 h-4 w-4" /> 新規ワークフロー作成
         </Button>
      </div>


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
                  <SelectItem key={wf.id} value={wf.id}>
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
                             ワークフロー「{selectedWorkflow.name}」を本当に削除しますか？関連ファイルも削除されます（削除ロジック実装後）。この操作は元に戻せません。
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>キャンセル</AlertDialogCancel>
                           <AlertDialogAction
                             onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                             className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                           >
                             削除する
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
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
               {/* Mermaid SVG will be rendered here */}
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
                  <CardDescription>このワークフローに関連するファイル。</CardDescription>
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
                         {/* Provide download link if URL exists */}
                          {file.url ? (
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-primary">
                              {file.name}
                            </a>
                          ) : (
                             <span className="text-sm">{file.name} {file.file ? '(未保存)' : ''}</span>
                          )}
                       </div>
                       {/* Delete only available in edit mode for clarity */}
                       {/* <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteFile(file.id)}>
                         <Trash2 className="h-4 w-4" />
                       </Button> */}
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
                 placeholder={`例:\ngraph TD\n    A[開始] --> B(処理1);\n    B --> C{条件?};\n    C -->|はい| D[処理2];\n    C -->|いいえ| E[終了];\n    D --> E;`}
                 className="font-mono text-sm"
               />
               <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary underline">Mermaid構文ヘルプ</a>
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild><Button variant="outline">キャンセル</Button></DialogClose>
             <Button onClick={handleAddWorkflow} className="bg-primary hover:bg-primary/90">作成</Button>
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
               <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2"> {/* Added scroll */}
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

                  {/* File List in Edit Modal */}
                  <div className="space-y-2 pt-4 border-t">
                     <Label>関連ファイル</Label>
                     {editingWorkflow.files.length > 0 ? (
                        <ul className="space-y-2">
                          {editingWorkflow.files.map(file => (
                            <li key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30 text-sm">
                               <div className="flex items-center gap-2 overflow-hidden mr-2">
                                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate" title={file.name}>{file.name} {file.file ? '(新規)' : ''}</span>
                               </div>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10 flex-shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                   <AlertDialogHeader>
                                     <AlertDialogTitle>ファイル削除確認</AlertDialogTitle>
                                     <AlertDialogDescription>
                                       ファイル「{file.name}」をこのワークフローから削除しますか？
                                       {file.url && ' ストレージからの削除は別途必要になる場合があります。'}
                                     </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                     <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                     <AlertDialogAction onClick={() => handleDeleteFile(file.id)} className="bg-destructive hover:bg-destructive/90">削除</AlertDialogAction>
                                   </AlertDialogFooter>
                                </AlertDialogContent>
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
              <DialogClose asChild><Button variant="outline">キャンセル</Button></DialogClose>
              <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" /> 保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </div>
  );
}
