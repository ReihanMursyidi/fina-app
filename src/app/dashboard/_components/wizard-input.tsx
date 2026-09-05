"use client";

import { useForm, Controller } from 'react-hook-form';
import { Loader2Icon, SparklesIcon, SendIcon } from 'lucide-react';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { KeyboardEvent } from 'react';
import { handleWizardInput } from '@/features/ai/chat';
import { Card, CardContent } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';

const formSchema = z.object({
   message: z.string().min(1, 'Message is required'),
});

export default function WizardInput() {
   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         message: '',
      },
   });

   const { mutate, isPending } = useMutation({
      mutationFn: handleWizardInput,
      onSuccess: (response) => {
         console.log(response);
         form.reset();
      },
      onError: (error) => {
         console.log(error);
      },
   });

   function onSubmit(data: z.infer<typeof formSchema>) {
      mutate(data.message);
   }

   function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault();
         onSubmit(form.getValues());
      }
   }

   return (
      <Card className="w-full border-primary/20 p-0">
         <CardContent className="pr-2">
            <form
               onSubmit={form.handleSubmit(onSubmit)}
               className="flex items-center gap-2"
            >
               <div className="text-primary">
                  <SparklesIcon className="size-5" />
               </div>

               <Controller
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                     <Field>
                     <input
                        {...field}
                        id="form-message"
                        placeholder="Write your transaction here"
                        autoComplete="off"
                        className="h-14 focus:outline-none"
                        onKeyDown={handleKeyDown}
                        disabled={isPending}
                     />
                     </Field>
                  )}
               />

               <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  disabled={isPending}
               >
                  {isPending ? (
                     <Loader2Icon className="size-5 animate-spin" />
                  ) : (
                     <SendIcon className="size-5" />
                  )}
               </Button>
            </form>
         </CardContent>
      </Card>
   );
}