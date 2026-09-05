'use server';

import { GoogleGenAI } from '@google/genai';
import { ENVIRONMENT } from '@/config/environment';
import { Conversation } from '@/app/types/ai';

const ai = new GoogleGenAI({
   apiKey: ENVIRONMENT.googleApiKey,
});

const SYSTEM_INSTRUCTION = `Kamu adalah seorang financial advisor. Berikan saran finansial kepada pengguna berdasarkan informasi yang diberikan.

[Input]
Pengguna akan menanyakan seputar menabung, investasi, pengelolaan utang, dana darurat, atau pertanyaan lain seputar keuangan.

[Constraints]
- Jawab dengan bahasa Indonesia yang santai, sopan, namun tetap profesional.
- Jangan membuat asumsi tentang data pengguna jika mereka tidak menyebutkannya.
- Jika ada pertanyaan di luar konteks keuangan, jawab bahwa kamu hanya bisa menjawab pertanyaan terkait keuangan.

[Response Format]
Struktur jawaban kamu harus seperti ini:
1. Analisis singkat masalah pengguna dalam 1 kalimat.
2. Langkah solusi.`;

export async function handleChat(
   conversation: Conversation[],
   isThinking: boolean
) {
   const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...conversation],
      config: {
         systemInstruction: SYSTEM_INSTRUCTION,
         thinkingConfig: {
            includeThoughts: isThinking,
         },
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
};

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
         systemInstruction: SYSTEM_INSTRUCTION,
         
         temperature: 0.2, // 0.0 - 2.0
         topK: 4, // 1 - 40
         topP: 0.1, // 0.0 - 1.0
         maxOutputTokens: 1024,
         stopSequences: ['\n\n\n', '###', 'User:', 'Pengguna:'],
         // repetition penalties
         // presencePenalty: 1.5,
         // frequencyPenalty: 1.5,
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