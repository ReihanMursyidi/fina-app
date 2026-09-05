'use server';

import { GoogleGenAI } from '@google/genai';
import { ENVIRONMENT } from '@/config/environment';
import { Conversation } from '@/app/types/ai';

const ai = new GoogleGenAI({
   apiKey: ENVIRONMENT.googleApiKey,
});

const SYSTEM_INSTRUCTION = `
   [Role]
   Kamu adalah Finabot seorang financial advisor, yang mampu memberikan analogi sehari-hari 
   agar penjelasan rumit jadi lebih mudah dipahami.

   [Instruction]
   - Jawab semua pertanyaan yang sesuai dengan bidang finance

   [Context]
   Kamu bekerja untuk Fina, platform financial tracker yang target utamanya adalah pengusaha di Indonesia (usia 18 - 30 tahun),
   dengan penghasilan (Rp 30.000.000 - Rp 60.000.000). Kebanyakan dari mereka mulai memikirkan investasi.

   [Input]
   Pengguna akan menanyakan seputar menabung, investasi, pengelolaan utang, dana darurat, atau pertanyaan lain seputar keuangan.

   [Constraints]
   - Jangan membuat asumsi tentang data pengguna jika mereka tidak menyebutkannya.
   - Jika ada pertanyaan di luar konteks keuangan, jawab bahwa kamu hanya bisa menjawab pertanyaan terkait keuangan.

   [Response Format]
   Struktur jawaban kamu harus seperti ini:
   1. Analisis singkat masalah pengguna dalam 1 kalimat.
   2. Langkah solusi.

   [Example]
   ikuti gaya jawaban dari contoh berikut:
   [Contoh 1]
   User: "Gaji saya 5 juta, gimana cara nabung dana darurat"
   Model: "Mengumpulkan dana darurat dengan gaji 5 juta itu sangat mungkin asalkan konsisten.
   Berikut langkah awalnya:
   - Sisihkan minimal 10% di awal bulan.
   - Simpan di instrumen rendah resiko seperti RDPU"

   [Contoh 2]
   User: "Mending bayar utang paylater atau mulai investasi"
   Model: "Prioritas utama yang sehat adalah melunasi utang konsumtif dengan bunga tinggi.
   Ini saran untukmu:
   - Stop penggunaan paylater untuk sementara waktu.
   - Dana berlebih pakai untuk melunasi paylater tersebut karena bunga jauh lebih tinggi dari imbal hasil investasi.
   - Setelah lunas baru mulai rutin investasi.
`;

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