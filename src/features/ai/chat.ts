'use server';

import { GoogleGenAI } from '@google/genai';
import { ENVIRONMENT } from '@/config/environment';
import { Conversation } from '@/app/types/ai';

const ai = new GoogleGenAI({
   apiKey: ENVIRONMENT.googleApiKey,
});

export async function handleChat(message: string, isThinking: boolean) {
   console.log(isThinking);
   const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
         thinkingConfig: {
            includeThoughts: isThinking
         }
      },
   });

   const result = {
      thought: '',
      answer: ''
   };

   if (isThinking) {
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) {
         return;
      }

      for (const part of parts) {
         if (!part.text) {
            continue;
         } else if (part.thought) {
            result.thought += part.text;
         } else {
            result.answer += part.text;
         }
      }
   } else {
      result.answer = `${response.text}`;
   }
   return result;
}

export async function* handleChatStreaming(
   conversation: Conversation[],
   isThinking: boolean,
) {
   const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [...conversation],
      config: {
         thinkingConfig: {
            includeThoughts: isThinking,
         },
      },
   });

   if (isThinking) {
      for await (const chunk of response) {
         const parts = chunk.candidates?.[0]?.content?.parts;
         if (parts) {
            for (const part of parts) {
               if (!part.text) {
                  continue;
               } else if (part.thought) {
                  yield `[thought]${part.text}`;
               } else {
                  yield part.text;
               }
            }
         }
      }
   } else {
      for await (const chunk of response) {
         if (chunk.text) {
            yield chunk.text;
         }
      }
   }
}