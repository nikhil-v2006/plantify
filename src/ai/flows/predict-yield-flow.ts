// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Predicts crop yield and provides optimization recommendations.
 *
 * - predictYield - A function that predicts crop yield.
 * - PredictYieldInput - The input type for the predictYield function.
 * - PredictYieldOutput - The return type for the predictYield function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictYieldInputSchema = z.object({
  cropType: z.string().describe('The type of crop being grown.'),
  fieldSize: z.string().describe('The size of the field (e.g., in acres or hectares).'),
  soilHealth: z.string().describe('A summary of the soil health metrics (e.g., pH, nutrients, organic matter).'),
  weatherForecast: z.string().describe('The weather forecast for the growing season (e.g., expected rainfall, temperature ranges).'),
  irrigation: z.string().describe('Current irrigation methods and frequency.'),
  fertilization: z.string().describe('Current fertilization plan (e.g., types of fertilizers, application schedule).'),
  pestControl: z.string().describe('Current pest control measures in place.'),
  historicalYield: z.string().describe('The average yield from previous seasons for the same crop and field.'),
});
export type PredictYieldInput = z.infer<typeof PredictYieldInputSchema>;

const PredictYieldOutputSchema = z.object({
  predictedYield: z.string().describe('The predicted crop yield for the current season (e.g., in tons per acre).'),
  recommendations: z.object({
      irrigation: z.string().describe('Actionable recommendation for optimizing irrigation.'),
      fertilization: z.string().describe('Actionable recommendation for optimizing fertilization.'),
      pestControl: z.string().describe('Actionable recommendation for optimizing pest control.'),
  }).describe('A set of actionable recommendations for optimization.'),
});
export type PredictYieldOutput = z.infer<typeof PredictYieldOutputSchema>;

export async function predictYield(input: PredictYieldInput): Promise<PredictYieldOutput> {
  return predictYieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictYieldPrompt',
  input: {schema: PredictYieldInputSchema},
  output: {schema: PredictYieldOutputSchema},
  prompt: `You are an expert agricultural AI specializing in crop yield prediction and optimization. Your task is to analyze the provided data to predict the crop yield and offer actionable recommendations to improve it.

Analyze the following data for a farmer's field:
- Crop Type: {{{cropType}}}
- Field Size: {{{fieldSize}}}
- Soil Health Metrics: {{{soilHealth}}}
- Weather Forecast: {{{weatherForecast}}}
- Current Irrigation Plan: {{{irrigation}}}
- Current Fertilization Plan: {{{fertilization}}}
- Current Pest Control Measures: {{{pestControl}}}
- Historical Yield: {{{historicalYield}}}

Based on this comprehensive data, perform the following:
1.  **Predict Yield**: Estimate the potential crop yield for the upcoming season. Present this as a realistic range (e.g., "4.5 - 5.2 tons per acre").
2.  **Provide Recommendations**: Generate a set of clear, concise, and actionable recommendations for the farmer to optimize their yield. These recommendations must cover:
    - Irrigation: Suggest adjustments to watering schedules or methods based on weather and soil.
    - Fertilization: Recommend changes to the nutrient plan.
    - Pest Control: Advise on proactive or reactive pest management strategies.

Your response must be data-driven and tailored to the specific conditions provided.`,
});

const predictYieldFlow = ai.defineFlow(
  {
    name: 'predictYieldFlow',
    inputSchema: PredictYieldInputSchema,
    outputSchema: PredictYieldOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
