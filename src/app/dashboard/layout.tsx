import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import ChatbotDrawer from './_components/chatbot-drawer';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        
        <main className="min-w-0 flex-1 p-4 custom-scrollbar">
          <SidebarTrigger className="mb-2 md:hidden" />
          {children}
          <ChatbotDrawer />
        </main>
        
      </SidebarProvider>
    </TooltipProvider>
  );
}