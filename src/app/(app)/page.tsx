
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Calendar, Workflow, Mic, FileText } from 'lucide-react';
import { useAuth } from "@/context/auth-context"; // Assuming useAuth provides user info

export default function DashboardPage() {
  const { user } = useAuth(); // Get user information if needed

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-primary">自治会役員会ワークスペースへようこそ！</h1>
      {user && <p className="mb-8 text-muted-foreground">{user.email} 様</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">議事録管理</CardTitle>
            <Mic className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              会議の録音から文字起こしを行い、AIが議事録を作成・管理します。
            </CardDescription>
            <Link href="/minutes" passHref>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                議事録へ移動
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">年間スケジュール</CardTitle>
            <Calendar className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              会費集金や総会など、年間の重要イベントを管理します。
            </CardDescription>
             <Link href="/schedule" passHref>
               <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                 スケジュールへ移動
               </Button>
             </Link>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">ワークフロー管理</CardTitle>
            <Workflow className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              集金などの業務フローを可視化し、関連ファイルを管理します。
            </CardDescription>
             <Link href="/workflows" passHref>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  ワークフローへ移動
                </Button>
             </Link>
          </CardContent>
        </Card>
      </div>

      {/* Optional: Add a section for recent activity or quick links */}
      {/* <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">最近のアクティビティ</h2>
        <Card>
          <CardContent className="pt-6">
             Placeholder for recent activity feed
            <p className="text-muted-foreground">最近のアクティビティはありません。</p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
