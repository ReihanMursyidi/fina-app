import { useForm, Controller } from 'react-hook-form';
import { SendIcon } from 'lucide-react';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

const formSchema = z.object({
   message: z.string().min(1, 'Message is required'),
});

export default function ChatbotTextarea() {
   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         message: '',
      },
   });

   function onSubmit(data: z.infer<typeof formSchema>) {
      form.reset();
   }
   return (
      <form className="flex flex-col p-2 bg-secondary rounded-2xl">
         <Controller
            control={form.control}
            name="message"
            render={({ field, fieldState }) => (
            <Field>
               <textarea
                  {...field}
                  id="form-message"
                  placeholder="Ask AI Advisor here"
                  autoComplete="off"
                  className="h-16 px-3 py-2 rounded-md resize-none focus:outline-none"
               />
            </Field>
            )}
         />
         <div className="flex justify-between">
            <div></div>
            <div>
            <Button
               type="submit"
               size="icon"
               variant="ghost"
               className="cursor-pointer text-primary hover:bg-primary/10 hover:text-primary disabled:bg-transparent"
            >
               <SendIcon className="size-5" />
            </Button>
            </div>
         </div>
      </form>
   );
}