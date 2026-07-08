
'use server';
/**
 * @fileOverview Summarizes the soil health, temperature, leaf diseases, and plant health for the dashboard.
 *
 * - summarizeDashboardInsights - A function that summarizes the dashboard insights.
 * - SummarizeDashboardInsightsInput - The input type for the summarizeDashboardInsights function.
 * - SummarizeDashboardInsightsOutput - The return type for the summarizeDashboardInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { cache } from 'react';

const SummarizeDashboardInsightsInputSchema = z.object({
  soilHealth: z.string().describe('The health of the soil.'),
  temperature: z.string().describe('The temperature around the region.'),
  leafDiseases: z.string().describe('Any leaf diseases that are present.'),
  plantHealth: z.string().describe('The overall health of the plants.'),
});
export type SummarizeDashboardInsightsInput = z.infer<typeof SummarizeDashboardInsightsInputSchema>;

const SummarizeDashboardInsightsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the soil health, temperature, leaf diseases, and plant health.'),
});
export type SummarizeDashboardInsightsOutput = z.infer<typeof SummarizeDashboardInsightsOutputSchema>;

export const summarizeDashboardInsights = cache(async function summarizeDashboardInsights(input: SummarizeDashboardInsightsInput): Promise<SummarizeDashboardInsightsOutput> {
  return summarizeDashboardInsightsFlow(input);
});


const prompt = ai.definePrompt({
  name: 'summarizeDashboardInsightsPrompt',
  input: {schema: SummarizeDashboardInsightsInputSchema},
  output: {schema: SummarizeDashboardInsightsOutputSchema},
  prompt: `You are a helpful agricultural assistant. Summarize the following farm conditions into a single, easy-to-read paragraph.

Soil Health: {{{soilHealth}}}
Temperature: {{{temperature}}}
Leaf Diseases: {{{leafDiseases}}}
Plant Health: {{{plantHealth}}}

Provide a concise summary.`,
});

const summarizeDashboardInsightsFlow = ai.defineFlow(
  {
    name: 'summarizeDashboardInsightsFlow',
    inputSchema: SummarizeDashboardInsightsInputSchema,
    outputSchema: SummarizeDashboardInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
