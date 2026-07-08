'use server';

/**
 * @fileOverview Provides customized pesticide recommendations based on AI analysis of plant diseases.
 *
 * - provideCustomizedPesticideRecommendation - A function that provides pesticide recommendations.
 * - ProvideCustomizedPesticideRecommendationInput - The input type for the provideCustomizedPesticideRecommendation function.
 * - ProvideCustomizedPesticideRecommendationOutput - The return type for the provideCustomizedPesticideRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideCustomizedPesticideRecommendationInputSchema = z.object({
  imageData: z
    .string()
    .describe(
      "A photo of a plant leaf, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  plantType: z.string().describe('The type of plant affected by the disease.'),
  soilType: z.string().describe('The type of soil the plant is growing in.'),
  location: z.string().describe('The geographical location where the plant is growing.'),
});
export type ProvideCustomizedPesticideRecommendationInput = z.infer<
  typeof ProvideCustomizedPesticideRecommendationInputSchema
>;

const ProvideCustomizedPesticideRecommendationOutputSchema = z.object({
  diseaseDetected: z
    .string()
    .describe('The name of the disease detected in the plant.'),
  cropType: z.string().describe('The type of crop identified.'),
  pesticideRecommendation: z
    .string()
    .describe(
      'A recommendation for a suitable pesticide or cure for the detected disease, considering the plant type, soil type, and location.'
    ),
  reasoning: z.string().describe('The reasoning behind the pesticide recommendation.'),
});
export type ProvideCustomizedPesticideRecommendationOutput = z.infer<
  typeof ProvideCustomizedPesticideRecommendationOutputSchema
>;

export async function provideCustomizedPesticideRecommendation(
  input: ProvideCustomizedPesticideRecommendationInput
): Promise<ProvideCustomizedPesticideRecommendationOutput> {
  return provideCustomizedPesticideRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideCustomizedPesticideRecommendationPrompt',
  input: {schema: ProvideCustomizedPesticideRecommendationInputSchema},
  output: {schema: ProvideCustomizedPesticideRecommendationOutputSchema},
  prompt: `You are an AI assistant specialized in identifying plant diseases and providing pesticide recommendations.

  Analyze the provided image of a plant leaf to identify the disease. Based on the detected disease, plant type, soil type, and geographical location, recommend a suitable pesticide or cure.
  Explain your reasoning for the recommendation.

  Image: {{media url=imageData}}
  Plant Type: {{{plantType}}}
  Soil Type: {{{soilType}}}
  Location: {{{location}}}

  Your analysis should be structured in the output format. Identify the disease and the crop type from the image.`,
});

const provideCustomizedPesticideRecommendationFlow = ai.defineFlow(
  {
    name: 'provideCustomizedPesticideRecommendationFlow',
    inputSchema: ProvideCustomizedPesticideRecommendationInputSchema,
    outputSchema: ProvideCustomizedPesticideRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
