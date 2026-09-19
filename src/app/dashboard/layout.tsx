import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import ChatbotDrawer from './_components/chatbot-drawer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ModeToggle } from '@/components/mode-toggle';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        
        <main className="flex-1 p-4 custom-scrollbar">
          <SidebarTrigger className="mb-2 md:hidden" />
          {children}
          <ChatbotDrawer />
        </main>
        <div className="mt-4 mr-4">
          <ModeToggle />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}