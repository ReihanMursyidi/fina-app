'use client';

import { useState, useRef, useEffect } from "react";

import Markdown from 'react-markdown';
import { BotIcon, XIcon, EllipsisIcon, ChevronDownIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { handleChatStreaming } from "@/features/ai/chat";
import ChatbotTextArea from "./chatbot-textarea";
import { Conversation } from "@/app/types/ai";

export default function ChatbotDrawer() {
   const chatRef = useRef<HTMLDivElement>(null);
   const [conversation, setConversation] = useState<
      Conversation[]
   >([]);
   
   const [isThinking, setIsThinking] = useState<boolean>(false);

   // const { mutate: handleChatMutation, isPending } = useMutation({
   //    mutationFn: ({
   //       message,
   //       isThinking,
   //    }: {
   //       message: string;
   //       isThinking: boolean;
   //    }) => handleChat(message, isThinking),

   //    onSuccess: (response) => {
   //       let parts: {
   //          text: string;
   //          thought?: boolean;
   //       }[] = [];

   //       if (response?.thought !== '') {
   //          parts = [
   //             ...parts,
   //             { thought: true, text: response?.thought || 'Terjadi kesalahan' },
   //          ];
   //       }

   //       const botMessage = {
   //          role: 'model',
   //          parts: [...parts, { text: response?.answer || 'Terjadi kesalahan' }],
   //       };
   //       setConversation((prev) => [...prev, botMessage]);
   //    },

   //    onError: (error) => {
   //       const botMessage = {
   //          role: 'model',
   //          parts: [{ text: 'Terjadi kesalahan' + error.message }]
   //       };
   //       setConversation((prev) => [...prev, botMessage]);
   //    }
   // });

   const { mutate: handleChatMutation, isPending } = useMutation({
      mutationFn: async ({ isThinking }: { isThinking: boolean }) => {
         if (isThinking) {
            setConversation((prev) => [
               ...prev,
               { role: 'model', parts: [{ thought: true, text: '' }, { text: '' }] },
            ]);

            const response = await handleChatStreaming(
               conversation,
               isThinking,
               'personal',
            );

            for await (const chunk of response) {
               setConversation((prev) => {
                  const newConversation = [...prev];
                  const lastIndex = newConversation.length - 1;

                  const parts = newConversation[lastIndex].parts;

                  newConversation[lastIndex] = {
                     ...newConversation[lastIndex],
                     parts: [
                        {
                           ...parts[0],
                           text: chunk.startsWith('[thought]')
                              ? parts[0].text + chunk.replace('[thought]', '')
                              : parts[0].text,
                        },
                        {
                           text: !chunk.startsWith('[thought]')
                              ? parts[1].text + chunk
                              : parts[1].text,
                        },
                     ],
                  };
                  return newConversation;
               });
            }
            return response;
         } else {
            setConversation((prev) => [
               ...prev,
               { role: 'model', parts: [{ text: '' }] },
            ]);

            const response = await handleChatStreaming(
               conversation,
               isThinking,
               'personal',
            );

            for await (const chunk of response) {
               setConversation((prev) => {
                  const newConversation = [...prev];
                  const lastIndex = newConversation.length - 1;

                  newConversation[lastIndex] = {
                     ...newConversation[lastIndex],
                     parts: [
                        { text: newConversation[lastIndex].parts[0].text + chunk },
                     ],
                  };
                  
                  return newConversation;
               });
            }
            return response;
         }
      },

      onError: (error) => {
         const botMessage = {
            role: 'model',
            parts: [{ text: 'Terjadi kesalahan: ' + error.message }],
         };
         setConversation((prev) => [...prev, botMessage]);
      },
   });

   function sendMessage(message: string) {
      const newMessage = {
         role: 'user',
         parts: [{ text: message }],
      };

      setConversation((prev) => [...prev, newMessage]);
      handleChatMutation({ isThinking });
   }

   useEffect(() => {
      if (chatRef.current) {
         chatRef.current?.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: 'smooth',
         });
      }
   }, [conversation]);

   return (
      <Drawer direction="right" modal={false}>
         <DrawerTrigger className="fixed bottom-4 right-4" asChild>
            <Button
               className="rounded-full size-14 hover:bg-primary/30 hover:text-primary shadow-lg"
               size="icon-lg"
               variant="outline"
            >
               <BotIcon className="size-6" />
            </Button>
         </DrawerTrigger>

         <DrawerContent className="w-screen! md:w-110!">
            <DrawerHeader className="flex flex-row justify-between border-b pb-4">
               <div>
                  <DrawerTitle className="font-bold text-primary">
                     AI Financial Advisor
                  </DrawerTitle>
                  <DrawerDescription>
                     Get personalized financial advice.
                  </DrawerDescription>
               </div>
               <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
                     <XIcon />
                  </Button>
               </DrawerClose>
            </DrawerHeader>

            <div className="h-full px-4 py-4 overflow-y-auto no-scrollbar bg-slate-50/50 dark:bg-background">
               {conversation.length > 0 ? (
                  <div
                     ref={chatRef} 
                     className="flex flex-col h-full gap-6 overflow-x-hidden overflow-y-auto no-scrollbar"
                  >
                     {conversation.map((message, index) => (
                        <div
                           key={`conversation-${index}`}
                           className={cn(
                              'flex flex-col gap-1.5 w-full',
                              message.role === 'model' ? 'items-start' : 'items-end',
                           )}
                        >
                           <div
                              className={cn('flex flex-col w-full', {
                                 'bg-primary/20 text-primary px-5 py-2 rounded-3xl rounded-br-md w-fit max-w-3/4':
                                    message.role === 'user'
                              })}
                           >
                              {message.role === 'model' && (
                                 <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                    <BotIcon className="size-3.5" />
                                    AI Advisor
                                 </div>
                              )}

                              {message.role === 'model' ? (
                                 <div className="response-ai">
                                    {message.parts.map((part, partIndex) => (
                                       <div key={`response-ai-${index}-${partIndex}`}>
                                          {part.thought ? (
                                             <Collapsible className="mb-2">
                                                <CollapsibleTrigger asChild>
                                                   <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted">
                                                      Tampilkan alur berpikir
                                                      <ChevronDownIcon className="size-3 ml-1" />
                                                   </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                   <div className="pl-3 ml-2 mt-2 border-l-2 border-slate-200 dark:border-muted-foreground/30 text-muted-foreground text-xs italic space-y-2">
                                                      <Markdown>{part.text}</Markdown>
                                                   </div>
                                                </CollapsibleContent>
                                             </Collapsible>
                                          ) : (
                                             <div className="[&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>h3]:font-bold [&>h3]:text-base [&>h3]:mb-2">
                                                <Markdown>{part.text}</Markdown>
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              ) : (
                                 message.parts[0].text
                              )}
                           </div>
                        </div>
                     ))}

                     {isPending && (
                        <div className="flex items-center animate-pulse">
                           <EllipsisIcon className="size-8 text-primary/50" />
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                     <BotIcon className="size-16 text-primary mb-2" />
                     <h2 className="text-2xl font-bold text-foreground">Hello There!</h2>
                     <h4 className="text-sm text-muted-foreground max-w-[80%]">Ask me anything about your finances or investment strategies.</h4>
                  </div>
               )}
            </div>

            <DrawerFooter className="border-t bg-background pt-4">
               <ChatbotTextArea
                  isThinking={isThinking}
                  setIsThinking={setIsThinking}
                  sendMessage={sendMessage} 
               />
            </DrawerFooter>
         </DrawerContent>
      </Drawer>
   );
}