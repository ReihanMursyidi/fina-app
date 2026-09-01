'use server';

import { GoogleGenAI } from '@google/genai';
import { ENVIRONMENT } from '@/config/environment';

const ai = new GoogleGenAI({
   apiKey: ENVIRONMENT.googleApiKey,
});

export async function handleChat() {
   const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Kamu itu siapa?',
      config: {},
   });
   console.log(response);
   return response.text;
}