
'use server';

/**
 * @fileOverview Provides a summary of crop health issues based on provided data.
 *
 * - aiCropHealthIssues - A function that provides a summary of crop health issues.
 * - AiCropHealthIssuesInput - The input type for the aiCropHealthIssues function.
 * - AiCropHealthIssuesOutput - The return type for the aiCropHealthIssues function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { cache } from 'react';

const AiCropHealthIssuesInputSchema = z.object({
  cropType: z.string().describe('The type of crop being assessed.'),
  fieldConditions: z.string().describe('A description of the current field conditions, including soil health, temperature, and water levels.'),
  leafAnalysisResults: z.string().describe('Results from the leaf analysis, including any diseases or pests detected.'),
  historicalData: z.string().describe('Historical data on crop health and soil conditions for the field.'),
  location: z.string().describe('The geographical location of the field.'),
});
export type AiCropHealthIssuesInput = z.infer<typeof AiCropHealthIssuesInputSchema>;

const AiCropHealthIssuesOutputSchema = z.object({
  summary: z.string().describe('A summary of the issues with the crop\'s health.'),
});
export type AiCropHealthIssuesOutput = z.infer<typeof AiCropHealthIssuesOutputSchema>;

export const aiCropHealthIssues = cache(async function aiCropHealthIssues(input: AiCropHealthIssuesInput): Promise<AiCropHealthIssuesOutput> {
  return aiCropHealthIssuesFlow(input);
});

const prompt = ai.definePrompt({
  name: 'aiCropHealthIssuesPrompt',
  input: {schema: AiCropHealthIssuesInputSchema},
  output: {schema: AiCropHealthIssuesOutputSchema},
  prompt: `You are an expert agricultural advisor. Generate a concise summary of the primary active risk to the crop's health based on the provided data. Focus on the most immediate threat.

Crop Type: {{{cropType}}}
Field Conditions: {{{fieldConditions}}}
Leaf Analysis Results: {{{leafAnalysisResults}}}
Location: {{{location}}}

Provide a single, concise sentence summarizing the main issue.`,
});

const aiCropHealthIssuesFlow = ai.defineFlow(
  {
    name: 'aiCropHealthIssuesFlow',
    inputSchema: AiCropHealthIssuesInputSchema,
    outputSchema: AiCropHealthIssuesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
