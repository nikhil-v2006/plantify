// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Provides a summary of soil analysis results, explaining key soil properties and their impact on crop health.
 *
 * - aiSoilAnalysis - A function that provides the soil analysis summary.
 * - AiSoilAnalysisInput - The input type for the aiSoilAnalysis function.
 * - AiSoilAnalysisOutput - The return type for the aiSoilAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSoilAnalysisInputSchema = z.object({
  latitude: z.number().describe('The latitude of the field.'),
  longitude: z.number().describe('The longitude of the field.'),
  cropType: z.string().describe('The type of crop being grown in the soil.'),
});
export type AiSoilAnalysisInput = z.infer<typeof AiSoilAnalysisInputSchema>;

const AiSoilAnalysisOutputSchema = z.object({
  summary: z.string().describe('A summary of the soil analysis results, including the key soil properties and their impact on crop health.'),
});
export type AiSoilAnalysisOutput = z.infer<typeof AiSoilAnalysisOutputSchema>;

export async function aiSoilAnalysis(input: AiSoilAnalysisInput): Promise<AiSoilAnalysisOutput> {
  return aiSoilAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSoilAnalysisPrompt',
  input: {schema: AiSoilAnalysisInputSchema},
  output: {schema: AiSoilAnalysisOutputSchema},
  prompt: `You are an expert in soil science and agriculture. Based on the provided geographical coordinates (Latitude: {{{latitude}}}, Longitude: {{{longitude}}}), infer the likely soil properties (pH, nutrient levels like Nitrogen, Phosphorus, Potassium, organic matter content, and soil moisture). Then, provide a summary of how these inferred properties might impact the specified crop type.

Crop Type: {{{cropType}}}

Summary:`,
});

const aiSoilAnalysisFlow = ai.defineFlow(
  {
    name: 'aiSoilAnalysisFlow',
    inputSchema: AiSoilAnalysisInputSchema,
    outputSchema: AiSoilAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
