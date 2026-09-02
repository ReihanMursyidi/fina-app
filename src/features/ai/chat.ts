'use server';

import { GoogleGenAI } from '@google/genai';
import { ENVIRONMENT } from '@/config/environment';

const ai = new GoogleGenAI({
   apiKey: ENVIRONMENT.googleApiKey,
});

export async function handleChat(message: string) {
   const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {},
   });
   
   return response.text;
}