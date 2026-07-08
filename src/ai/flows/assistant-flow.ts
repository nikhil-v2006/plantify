'use server';
/**
 * @fileOverview A conversational AI assistant for the CropWise app.
 *
 * - assistant - A function that handles the conversational chat.
 * - assistantFlow - The Genkit flow that powers the assistant.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {mockFieldData} from '@/lib/data';
import {history as checkupHistory} from '@/lib/data'; // In a real app, this would be a database call.

// Define a tool for the AI to get field data
const getFieldDataTool = ai.defineTool(
  {
    name: 'getFieldData',
    description: 'Get information about the user\'s fields, such as crop type, soil conditions, and location.',
    outputSchema: z.any(),
  },
  async () => {
    return mockFieldData;
  }
);

// Define a tool for the AI to get checkup history
const getCheckupHistoryTool = ai.defineTool(
  {
    name: 'getCheckupHistory',
    description: 'Get the history of crop health checkups, including dates, diseases detected, and overall status.',
    outputSchema: z.any(),
  },
  async () => {
    // In a real app, we might want to fetch this from localStorage or a database
    // For now, we'll use the mock data.
    return checkupHistory;
  }
);

const AssistantFlowInputSchema = z.object({
    prompt: z.string(),
    language: z.string(),
});

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantFlowInputSchema,
    outputSchema: z.string(),
  },
  async ({prompt, language}) => {
    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      tools: [getFieldDataTool, getCheckupHistoryTool],
      system: `You are a friendly and knowledgeable AI assistant for the CropWise application, acting as a "Digital Krishi Officer." You are an expert agronomist and botanist. Your primary function is to answer any and all questions related to plants, farming, and agriculture. This includes but is not limited to: plant identification, crop diseases, soil health, treatment recommendations, pest control, weather, subsidies, market trends, and general farming techniques.

Your goal is to be as helpful as possible, providing accurate, context-aware answers instantly, like having an expert in your pocket.

Respond in the user's specified language: ${language}. Use simple, clear, and easy-to-understand language.

If the user asks about their own farm, use the provided tools to get their specific field data and checkup history to give a personalized and actionable answer.

If you don't know the answer or a question is outside the scope of agriculture, politely state that you cannot answer.
      `,
    });

    return llmResponse.text;
  }
);

export async function assistant(prompt: string, language: string) {
  return assistantFlow({prompt, language});
}
