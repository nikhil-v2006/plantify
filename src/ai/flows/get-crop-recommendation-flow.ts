
'use server';

/**
 * @fileOverview Provides crop recommendations based on geographical location, including potential diseases and treatments.
 *
 * - getCropRecommendation - A function that returns crop recommendations.
 * - GetCropRecommendationInput - The input type for the function.
 * - GetCropRecommendationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetCropRecommendationInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetCropRecommendationInput = z.infer<typeof GetCropRecommendationInputSchema>;

const RecommendedCropSchema = z.object({
    name: z.string().describe("The name of the recommended crop."),
    reason: z.string().describe("The reason why this crop is recommended for the given location."),
    estimatedYield: z.string().describe("Estimated yield for the crop in the given location."),
    potentialDiseases: z.string().describe("A list of common diseases or pests that might affect this crop in the given region."),
    recommendedPesticides: z.string().describe("General recommendations for pesticides or insecticides to manage the potential diseases.")
});

const GetCropRecommendationOutputSchema = z.object({
  recommendations: z.array(RecommendedCropSchema).describe("An array of crop recommendations."),
});
export type GetCropRecommendationOutput = z.infer<typeof GetCropRecommendationOutputSchema>;

export async function getCropRecommendation(input: GetCropRecommendationInput): Promise<GetCropRecommendationOutput> {
  return getCropRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCropRecommendationPrompt',
  input: {schema: GetCropRecommendationInputSchema},
  output: {schema: GetCropRecommendationOutputSchema},
  prompt: `You are an expert agricultural advisor. Based on the provided geographical coordinates (Latitude: {{{latitude}}}, Longitude: {{{longitude}}}), analyze the local climate, soil type, and other relevant environmental factors to recommend suitable crops.

Provide a list of 3-5 crop recommendations. For each crop, provide:
1. A clear reason for the recommendation.
2. An estimated potential yield.
3. A list of common potential diseases or pests for that crop in the region.
4. General recommendations for the types of pesticides or insecticides that can be used.
`,
});

const getCropRecommendationFlow = ai.defineFlow(
  {
    name: 'getCropRecommendationFlow',
    inputSchema: GetCropRecommendationInputSchema,
    outputSchema: GetCropRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
