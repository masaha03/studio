
"use client";

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale'; // Import Japanese locale
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
import { PlusCircle, Edit, Trash2, AlertCircle } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";


// Define the structure for a schedule item
interface ScheduleItem {
  id: string;
  date: string; // Store date as ISO string (e.g., "2024-07-15")
  title: string;
  description?: string;
}

// Mock data - Replace with Firestore fetching/saving
const initialSchedule: ScheduleItem[] = [
  { id: '1', date: format(new Date(2024, 6, 20), 'yyyy-MM-dd'), title: '夏祭り準備会' },
  { id: '2', date: format(new Date(2024, 7, 10), 'yyyy-MM-dd'), title: '夏祭り当日', description: '会場設営 9:00〜' },
  { id: '3', date: format(new Date(2024, 9, 1), 'yyyy-MM-dd'), title: '会費集金開始' },
  { id: '4', date: format(new Date(2024, 9, 30), 'yyyy-MM-dd'), title: '会費集金締切' },
  { id: '5', date: format(new Date(2025, 2, 15), 'yyyy-MM-dd'), title: '総会準備' },
  { id: '6', date: format(new Date(2025, 3, 5), 'yyyy-MM-dd'), title: '定期総会' },
];


export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemDate, setNewItemDate] = useState<Date | undefined>(selectedDate);
  const { toast } = useToast();


  useEffect(() => {
    // TODO: Fetch schedule data from Firestore here
    // For now, we use the initialSchedule
  }, []);

   useEffect(() => {
     // When selectedDate changes, update the date for new items if the modal isn't open
     if (!isModalOpen) {
       setNewItemDate(selectedDate);
     }
   }, [selectedDate, isModalOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setNewItemDate(date); // Also update default date for new items
  };

  const getItemsForDate = (date: Date | undefined): ScheduleItem[] => {
    if (!date) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedule.filter(item => item.date === dateStr);
  };

  const openAddModal = () => {
      setEditingItem(null);
      setNewItemTitle('');
      setNewItemDescription('');
      // Use the currently selected calendar date as default for new items
      setNewItemDate(selectedDate || new Date());
      setIsModalOpen(true);
    };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setNewItemTitle(item.title);
    setNewItemDescription(item.description || '');
    setNewItemDate(parseISO(item.date)); // Parse ISO string back to Date
    setIsModalOpen(true);
  };

  const handleSaveItem = () => {
     if (!newItemTitle.trim()) {
       toast({ title: "エラー", description: "タイトルは必須です。", variant: "destructive" });
       return;
     }
     if (!newItemDate) {
       toast({ title: "エラー", description: "日付を選択してください。", variant: "destructive" });
       return;
     }

     const formattedDate = format(newItemDate, 'yyyy-MM-dd');

     if (editingItem) {
       // Update existing item
       const updatedSchedule = schedule.map(item =>
         item.id === editingItem.id
           ? { ...item, date: formattedDate, title: newItemTitle.trim(), description: newItemDescription.trim() || undefined }
           : item
       );
       setSchedule(updatedSchedule);
       // TODO: Update item in Firestore
       toast({ title: "更新完了", description: `「${newItemTitle}」を更新しました。` });
     } else {
       // Add new item
       const newItem: ScheduleItem = {
         id: Date.now().toString(), // Simple ID generation
         date: formattedDate,
         title: newItemTitle.trim(),
         description: newItemDescription.trim() || undefined,
       };
       setSchedule(prev => [...prev, newItem]);
       // TODO: Add item to Firestore
       toast({ title: "追加完了", description: `「${newItemTitle}」を追加しました。` });
     }
     setIsModalOpen(false);
     setEditingItem(null); // Reset editing state
   };


   const handleDeleteItem = (id: string) => {
      const itemToDelete = schedule.find(item => item.id === id);
      if (!itemToDelete) return;

      setSchedule(prev => prev.filter(item => item.id !== id));
      // TODO: Delete item from Firestore
      toast({ title: "削除完了", description: `「${itemToDelete.title}」を削除しました。` });
    };


  const selectedDateItems = getItemsForDate(selectedDate);

  // Custom modifier for days with events
   const eventDays = schedule.map(item => parseISO(item.date));


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">年間スケジュール管理</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>カレンダー</CardTitle>
            <CardDescription>日付を選択してイベントを確認・追加します。</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border p-4"
              locale={ja} // Set locale to Japanese
              modifiers={{ events: eventDays }} // Highlight event days
               modifiersStyles={{
                 events: { // Style for event days (e.g., a dot) - requires CSS in globals.css or here
                    fontWeight: 'bold',
                    color: 'hsl(var(--primary))', // Use primary color
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                 }
               }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'yyyy年 M月 d日 (E)', { locale: ja }) : '日付を選択'} の予定
            </CardTitle>
             <Button size="sm" onClick={openAddModal} className="mt-2 bg-accent hover:bg-accent/90 text-accent-foreground">
               <PlusCircle className="mr-2 h-4 w-4" /> 新規予定追加
             </Button>
          </CardHeader>
          <CardContent>
            {selectedDateItems.length > 0 ? (
              <ul className="space-y-3">
                {selectedDateItems.map(item => (
                  <li key={item.id} className="border p-3 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors">
                    <div className="flex justify-between items-start">
                       <div>
                         <p className="font-semibold">{item.title}</p>
                         {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                       </div>
                       <div className="flex space-x-1 flex-shrink-0 ml-2">
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-100" onClick={() => openEditModal(item)}>
                           <Edit className="h-4 w-4" />
                           <span className="sr-only">編集</span>
                         </Button>

                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                               <Trash2 className="h-4 w-4" />
                               <span className="sr-only">削除</span>
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>
                                 <AlertCircle className="inline-block mr-2 h-5 w-5 text-destructive" />
                                 削除確認
                                </AlertDialogTitle>
                               <AlertDialogDescription>
                                 予定「{item.title}」を本当に削除しますか？この操作は元に戻せません。
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>キャンセル</AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={() => handleDeleteItem(item.id)}
                                 className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                               >
                                 削除する
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-4">選択された日付に予定はありません。</p>
            )}
          </CardContent>
        </Card>
      </div>

       {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? '予定の編集' : '新規予定の追加'}</DialogTitle>
              <DialogDescription>
                {editingItem ? '予定の詳細を編集します。' : '新しい予定の詳細を入力してください。'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-date" className="text-right">
                  日付
                </Label>
                 <div className="col-span-3">
                    <Input
                      id="item-date"
                      type="date"
                      value={newItemDate ? format(newItemDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setNewItemDate(e.target.value ? parseISO(e.target.value) : undefined)}
                      className="w-full"
                    />
                 </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-title" className="text-right">
                  タイトル <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="item-title"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-description" className="text-right">
                  詳細 (任意)
                </Label>
                <Textarea
                  id="item-description"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild>
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
               </DialogClose>
              <Button type="button" onClick={handleSaveItem} className="bg-primary hover:bg-primary/90">
                {editingItem ? '更新' : '追加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </div>
  );
}

