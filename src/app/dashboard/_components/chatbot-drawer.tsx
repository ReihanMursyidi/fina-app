'use client';

import { useState } from "react";
import { BotIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
   Drawer,
   DrawerClose,
   DrawerTrigger,
   DrawerContent,
   DrawerHeader,
   DrawerTitle,
   DrawerDescription,
   DrawerFooter
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import ChatbotTextArea from "./chatbot-textarea";

export default function ChatbotDrawer() {
   const [conversation, setConversation] = useState<
      {
         role: string;
         parts: {
            text: string;
         }[];
      }[]
   >([
      {
         role: "user",
         parts: [
            {
               text: 'Hello'
            },
         ],
      },
      {
         role: 'model',
         parts: [
            {
               text: 'Hi there! How can I assist you today?'
            }
         ]
      }
   ]);

   return (
      <Drawer direction="right" modal={false}>
         <DrawerTrigger className="fixed bottom-4 right-4" asChild>
            <Button
               className="rounded-full size-14 hover:bg-primary/30 hover:text-primary"
               size="icon-lg"
               variant="outline"
            >
               <BotIcon className="size-6" />
            </Button>
         </DrawerTrigger>

         <DrawerContent className="w-screen! md:w-110!">
            <DrawerHeader className="flex flex-row justify-between">
               <div>
                  <DrawerTitle className="font-bold text-primary">
                     AI Financial Advisor
                  </DrawerTitle>
                  <DrawerDescription>
                     Get personalized financial advice.
                  </DrawerDescription>
               </div>
               <DrawerClose asChild>
                  <Button variant="outline" size="icon">
                     <XIcon />
                  </Button>
               </DrawerClose>
            </DrawerHeader>

            <div className="h-full px-4 overflow-y-auto no-scrollbar">
               {conversation.length > 0 ? (
                  <div className="flex flex-col h-full gap-8overflow-x-hidden overflow-y-auto no-scrollbar">
                     {conversation.map((message, index) => (
                        <div
                           key={`conversation-${index}`}
                           className={cn(
                              'flex flex-col gap-2',
                              message.role === 'model' ? 'items-start' : 'items-end',
                           )}
                        >
                           <div
                              className={cn('flex flex-col w-full', {
                                 'bg-primary/20 text-primary px-5 py-2 rounded-3xl rounded-br-md w-fit max-w-3/4':
                                    message.role === 'user',
                              })}
                           >
                              {message.role === 'model' && (
                                 <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                                    <BotIcon />
                                    AI Advisor
                                 </div>
                              )}
                              {message.parts[0].text}
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                     <h2 className="text-3xl font-bold text-primary">Welcome to your AI Financial Advisor!</h2>
                     <h4 className="text-xl">Ask me anything about your finances!</h4>
                  </div>
               )}
            </div>

            <DrawerFooter>
               <ChatbotTextArea />
            </DrawerFooter>
         </DrawerContent>
      </Drawer>
   );
}