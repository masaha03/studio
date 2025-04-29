
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, Workflow, Mic, FileText, Home } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can show a loading spinner here
    return (
       <div className="flex items-center justify-center h-screen">
         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
       </div>
    );
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return '??';
    const namePart = email.split('@')[0];
    return namePart.substring(0, 2).toUpperCase();
  };


  return (
    <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon">
          <SidebarHeader className="items-center">
             <div className="flex items-center justify-between w-full">
               <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                 自治会アプリ
               </h1>
                <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent" />
             </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                 <Link href="/" passHref legacyBehavior>
                   <SidebarMenuButton tooltip="ホーム">
                     <Home />
                     <span>ホーム</span>
                   </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/minutes" passHref legacyBehavior>
                  <SidebarMenuButton tooltip="議事録管理">
                    <Mic />
                    <span>議事録管理</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/schedule" passHref legacyBehavior>
                  <SidebarMenuButton tooltip="年間スケジュール">
                    <Calendar />
                    <span>年間スケジュール</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/workflows" passHref legacyBehavior>
                  <SidebarMenuButton tooltip="ワークフロー">
                    <Workflow />
                    <span>ワークフロー</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarSeparator />

          <SidebarFooter className="p-2 items-start">
             <div className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-sidebar-accent transition-colors duration-200">
                <Avatar className="h-8 w-8">
                   {/* Add user image if available */}
                   <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                     {getInitials(user.email)}
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate text-sidebar-foreground">{user.email}</span>
                 </div>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="ml-auto h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
                   onClick={signOut}
                   aria-label="サインアウト"
                 >
                   <LogOut size={18} />
                 </Button>
             </div>
             {/* Tooltip for sign out when collapsed */}
             <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="mt-2 h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hidden group-data-[collapsible=icon]:flex items-center justify-center"
                       onClick={signOut}
                       aria-label="サインアウト"
                     >
                       <LogOut size={18} />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">サインアウト</TooltipContent>
                </Tooltip>
             </TooltipProvider>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
             <div className="p-4 md:p-6 min-h-screen">
               {children}
             </div>
        </SidebarInset>
    </SidebarProvider>
  );
}

// Re-export Tooltip components needed within this layout
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
