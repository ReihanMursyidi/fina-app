'use server';

import z from 'zod';
import { createAI } from './instance';
import { FunctionDeclaration, Type } from '@google/genai';
import { createTransaction } from '../transaction/action';

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
   await createTransaction(transaction);

   return 'Create transaction success';
}

const createTransactionDeclaration: FunctionDeclaration = {
   name: 'create_transaction',
   description:
      "Create a new transaction in the user's financial history based on the provided details.",
   parameters: {
      type: Type.OBJECT,
      properties: {
         amount: {
            type: Type.NUMBER,
            description: 'The amount of the transaction'
         },
         type: {
            type: Type.STRING,
            enum: ['income', 'expense'],
            description: 
               "The type of the transaction, either 'income' or 'expense'",
         },
         category: {
            type: Type.STRING,
            enum: [
               'Food & Drink',
               'Shopping',
               'Housing',
               'Transportation',
               'Entertainment',
               'Salary',
               'Others',
            ],
            description: 
               "The type of the transaction",
         },
         description: {
            type: Type.STRING,
            description: 'A brief description of the transaction, first letter capitalized',
         },
         date: {
            type: Type.STRING,
            description: 'The date of the transaction in the format of "YYYY-MM-DD"'
         }
      },
      required: ['amount', 'description', 'type', 'category', 'date']
   },
};

export async function handleWizardTools(message: string) {
   const contents = `
      <role>
         You are an AI Wizard finance assitant, who can extract transaction details from text.
      </role>
      <instruction>
         Extract the transaction details from the following text.
      </instruction>
      <context>
         Current Date : ${new Date().toISOString()}
      </context>
      <input>
         Text to extract: ${message}
      </input>
   `;

   const ai = createAI();
   const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
         tools: [
            {
               functionDeclarations: [createTransactionDeclaration],
            },
         ],
      },
   });

   if (response.functionCalls && response.functionCalls.length > 0) {
      await Promise.all(
         response.functionCalls.map(async (functionCall) => {
            switch (functionCall.name) {
               case 'create_transaction':
                  const args = functionCall.args;
                  if (!args) {
                     throw new Error('No arguments provided for create transaction');
                  }
      
                  const transaction = transactionSchema.parse(args);
                  if (transaction.amount <= 0) {
                     throw new Error('Cannot create transaction with invalid amount');
                  }
                  await createTransaction(transaction);
                  break;
               default:
                  throw new Error(`Unknown function call`);
            }
         }),
      );
      return 'Function executed successfully';
      
   } else {
      throw new Error('AI did not call any function');
   }
}