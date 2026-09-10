'use server';

import { Type } from "@google/genai";
import { findEmbedding } from "./embedding";
import { createAI } from "./instance";
import { Transaction } from "@/app/types/transaction";

export async function generateChart(request: string) {
   const ai = createAI();

   const data = await findEmbedding(request, 0.5, 50);

   let contextData = "";

   if (!data || data.length === 0) {
      contextData = "No transactions found that are similar or relevant to the request";
   } else {
      contextData = data.map((transaction: Transaction) => {
         return JSON.stringify(transaction);
      }).join('\n');
   }

   const contents = {
      role: 'user',
      parts: [
         {
            text: `
               <role>
                  You are an AI Financial Analyst and data engineering specialist. Your task is to analyze transactions 
                  in <context> and generate a structured JSON configuration to render charts that directly response the user's request.
               </role>
               <input>
                  User request: "${request}"
               </input>
               <instruction>
                  1. Analyze and filter: read the user's request and extract only the relevant transactions from the provided <context>.
                  2. Grouping and Summarization:
                     -  If the query is about expense type, group by category name.
                     -  If it's about time trend, group by date, day, or month.
                     -  If it's comparing income and expenses, group by type.
                     -  Limit the data to the top 10 most significant groups to ensure the chart is clean on the dashboard, group smaller items into "Other" if necessary.
                  3. Values & Calculations: Ensure all currency values are aggregated correctly. Use positive number for visual chart representation.
                  4. Chart Type Selection:
                     -  Use 'chartType: "pie"' if the user asks for proportions, ratios, percentages, or category composition.
                     -  Use 'chartType: "bar"' if the user asks for comparison, over-time trends, chronological analysis, or comparing individual entities.
               </instruction>
               <context>
                  Current Date : ${new Date().toISOString()}
                  Data transaction: ${contextData}
               </context>
               <constraints>
                  -  Respond strictly with a raw and valid JSON object matching the requested schema.
                  -  DO NOT include markdown code blocks, backticks, or any conversational text.
               </contraints>
            `
         },
      ],
   };

   const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
         responseMimeType: 'application/json',
         responseSchema: {
            type: Type.OBJECT,
            properties: {
               chartType: {
                  type: Type.STRING,
                  enum: ['bar', 'pie'],
                  description: 'Chart type to render',
               },
               data: {
                  type: Type.ARRAY,
                  description: 'Array of object for data chart',
                  items: {
                     type: Type.OBJECT,
                     properties: {
                        name: {type: Type.STRING},
                        value: {type: Type.NUMBER},
                     },
                     required: ['name', 'value'],
                  },
               },
            },
            required: ['chartType', 'data'],
         }
      }
   });

   if (!response.text) {
      throw new Error('Failed to generate chart');
   }

   const chartData = JSON.parse(response.text);

   return chartData;
};