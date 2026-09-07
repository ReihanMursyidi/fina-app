'use server';

import { createAI } from '@/features/ai/instance';
import { Conversation } from '@/app/types/ai';
import z from 'zod';
import { createClient } from '@/lib/supabase/server';
import { findEmbedding } from './embedding';
import { Transaction } from '@/app/types/transaction';

const SYSTEM_INSTRUCTION = `
   [Role]
   Kamu adalah Finabot seorang financial advisor, yang mampu memberikan analogi sehari-hari 
   agar penjelasan rumit jadi lebih mudah dipahami.

   [Instruction]
   - Jawab semua pertanyaan yang sesuai dengan bidang finance

   [Context]
   Kamu bekerja untuk Reihan, platform financial tracker yang target utamanya adalah pengusaha di Indonesia (usia 18 - 30 tahun),
   dengan penghasilan (Rp 30.000.000 - Rp 60.000.000). Kebanyakan dari mereka mulai memikirkan investasi.

   [Input]
   Pengguna akan menanyakan seputar menabung, investasi, pengelolaan utang, dana darurat, atau pertanyaan lain seputar keuangan.

   [Constraints]
   - Jangan membuat asumsi tentang data pengguna jika mereka tidak menyebutkannya.
   - Jika ada pertanyaan di luar konteks keuangan, jawab bahwa kamu hanya bisa menjawab pertanyaan terkait keuangan.

   [Workflow Steps]
   1. Identifikasi pengguna, tanyakan usia, penghasilan/ budget, tujuan keuangannya.
   2. Analisis masalah utama pengguna dan  data apa yang kurang.
   3. Tentukan rencana yang harus dijalankan.
   4. Periksa kembali hasil dari action.
   5. Keluarkan jawaban akhir ke pengguna

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
   isThinking: boolean,
) {
   const ai = createAI();
   const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [...conversation],
      config: {
         thinkingConfig: {
            includeThoughts: isThinking,
         },
      },
   });

   const result = {
      thought: '',
      answer: '',
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

async function generalChat(conversation: Conversation[], isThinking?: boolean) {
   const ai = createAI();
   const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [...conversation],
      config: {
         systemInstruction: SYSTEM_INSTRUCTION,
         thinkingConfig: {
            includeThoughts: isThinking,
         },
         temperature: 0.2,
         topK: 5,
         topP: 0.1,
         maxOutputTokens: 2048,
         stopSequences: ['\n\n\n', '###', 'User:', 'Pengguna:'],
      },
   });
   return response;
}

async function personalizedChat(
   query: string, 
   historyChat?: Conversation[], 
   isThinking?: boolean,
) {
   const ai = createAI();

   const data = await findEmbedding(query);

   let contextData = '';

   if(!data || data.length === 0) {
      contextData = 'No transactions found that are similar or relevant';
   } else {
      contextData = data.map((transaction: Transaction) => {
         return JSON.stringify(transaction);
      })
      .join('\n');
   }

   const prompt = `
      <role>
         You are an AI Financial Analyst. You are helping the user analyze 
         their financial data using the RAG (Retrieval-Augmented Generation) technique.
      </role>
      <input>
         User Question: "${query}"
      </input>
      <context>
         Relevant Transaction data from the database (Ordered from most relevant):
         ${contextData}
      </context>
      <instruction>
         - Answer the user question ONLY based on the relevant transaction data above.
         - If there are calculations (total spending, average, etc), calculate them accurately based on the data.
         - Provide the answer in a neat, professional, yet easy-to-understand markdown format.
         - If there is no relevant data at all, state that the data is not availble in the history.
         - If user question is general and not need a data, response generally.
      </instruction>
      <constraints>
         - Don't answer in table format instead of markdown.
      </contraints>
   `;

   const response = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash',
      contents: [
         ...(historyChat ?? []),
         { role: 'user', parts: [{ text: prompt }] },
      ],
      config: {
         thinkingConfig: {
            includeThoughts: isThinking,
         },
      },
   });

   return response;
}

export async function* handleChatStreaming(
   conversation: Conversation[],
   isThinking: boolean,
   mode: 'general' | 'personal',
) {
   let response;

   if (mode === 'general') {
      response = await generalChat(conversation, isThinking);
   } else {
      response = await personalizedChat(
         conversation[conversation.length - 1].parts[0].text,
         conversation.slice(0, -1),
         isThinking,
      );
   }

   // Type Guard: Beritahu TypeScript untuk mengeksekusi blok ini 
   // HANYA JIKA response terbukti sebagai stream (AsyncGenerator)
   if (Symbol.asyncIterator in response) {
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
   } else {
      // Fallback jika API tiba-tiba mengembalikan respons tunggal (bukan stream)
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
         for (const part of parts) {
            if (part.thought && isThinking) {
               yield `[thought]${part.text}`;
            } else if (part.text) {
               yield part.text;
            }
         }
      }
   }
}

const transactionSchema = z.object({
   amount: z.number().default(0).describe('Transaction nominal'),
   type: z.enum(['income', 'expense']).describe('Type of transaction'),
   category: z
      .enum([
         'Food & Drink',
         'Shopping',
         'Housing',
         'Transportation',
         'Entertainment',
         'Salary',
         'Others',
      ])
      .describe('Category of transaction'),
   description: z.string().describe('Short text for describing transaction'),
   date: z.string().describe('the date of transaction in YYYY-MM-DD format'),
});

export async function handleWizardInput(message: string) {
   const contents = `
   <role>
      You are an AI Wizard finance assitant, who can extract transaction details from text.
   </role>
   <instruction>
      Extract the transaction details from the following text and return it as a structure JSON object.
      The JSON object must have exactly these fields:
      - "amount": a number representing the cost (positive). Use 0 if not provided.
      - "type": type of transaction, either 'income' or 'expense'.
      - "category": choose the most appropriate category from this exact list:
                     'Food & Drink','Shopping','Housing','Transportation','Entertainment','Salary','Others'.
      - "description": a short string describing the transaction, first letter capitalized.
      - "date": date of transaction in YYYY-MM-DD format.
               Assume the current date if relative terms like 'today' or 'just now'. If not define use current date.
   </instruction>
   <context>
      Current Date : ${new Date().toISOString()}
   </context>
   <input>
      Text to extract: ${message}
   </input>
   <outputFormat>
      Respond with only the raw JSON object, no markdown blocks, no text before or after.
   </outputFormat>
   `;

   const ai = createAI();
   const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
         responseMimeType: 'application/json',
         responseSchema: z.toJSONSchema(transactionSchema),
      },
   });

   const transaction = transactionSchema.parse(JSON.parse(`${response.text}`));

   if (transaction.amount <= 0) {
      throw new Error('Cannot create transaction with invalid amount');
   }

   return transaction;
}

