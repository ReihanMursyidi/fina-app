'use client';

import { Button } from "@/components/ui/button";
import { handleChat } from "@/features/ai/chat";
import { BotIcon } from "lucide-react";

export default function ChatbotDrawer() {
   return (
      <div className="fixed bottom-4 right-4">
         <Button
            className="flex items-center justify-center text-white rounded-full size-14 bg-primary"
            size="icon-lg"
            variant="outline"
            onClick={async () => {
               const result = await handleChat();
               console.log(result);
            }}   
         >
            <BotIcon className="size-6"  />
         </Button>
      </div>
   );
}