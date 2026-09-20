import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import ChatbotDrawer from './_components/chatbot-drawer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        
        <ScrollArea className="flex-1 h-screen bg-background">
          <div className="p-4">
            <SidebarTrigger className="mb-2 md:hidden" />
            {children}
            <ChatbotDrawer />
          </div>
        </ScrollArea>
        
      </SidebarProvider>
    </TooltipProvider>
  );
}