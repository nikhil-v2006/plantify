'use server';
/**
 * @fileOverview Analyzes a hyperspectral image to provide a detailed crop health report.
 *
 * - analyzeHyperspectralImage - A function that analyzes the image data.
 * - AnalyzeHyperspectralImageInput - The input type for the function.
 * - AnalyzeHyperspectralImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeHyperspectralImageInputSchema = z.object({
  imageData: z
    .string()
    .describe(
      "The hyperspectral image data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The name of the uploaded file.'),
});
export type AnalyzeHyperspectralImageInput = z.infer<
  typeof AnalyzeHyperspectralImageInputSchema
>;

const AnalyzeHyperspectralImageOutputSchema = z.object({
  report: z
    .string()
    .describe(
      'A detailed report on crop health, including nutrient deficiencies, water stress, and disease detection.'
    ),
});
export type AnalyzeHyperspectralImageOutput = z.infer<
  typeof AnalyzeHyperspectralImageOutputSchema
>;

export async function analyzeHyperspectralImage(
  input: AnalyzeHyperspectralImageInput
): Promise<AnalyzeHyperspectralImageOutput> {
  return analyzeHyperspectralImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeHyperspectralImagePrompt',
  input: {schema: AnalyzeHyperspectralImageInputSchema},
  output: {schema: AnalyzeHyperspectralImageOutputSchema},
  prompt: `You are an expert in remote sensing and agricultural analysis. You are provided with a hyperspectral image of a crop leaf.

Analyze the spectral data from the image to generate a detailed report on the crop's health. The report should cover the following areas:
1.  **Nutrient Status**: Identify any potential deficiencies or excesses of key nutrients (e.g., Nitrogen, Phosphorus, Potassium).
2.  **Water Stress**: Assess the plant's water content and identify signs of drought stress.
3.  **Disease/Pest Detection**: Look for spectral signatures that may indicate the presence of common diseases or pests for the likely crop type.
4.  **Overall Health Assessment**: Provide a summary of the plant's health and recommend actions.

Based on the file name "{{fileName}}", infer the crop type if possible. The image data itself is provided.

{{media url=imageData}}

Generate a comprehensive report based on your analysis.`,
});

const analyzeHyperspectralImageFlow = ai.defineFlow(
  {
    name: 'analyzeHyperspectralImageFlow',
    inputSchema: AnalyzeHyperspectralImageInputSchema,
    outputSchema: AnalyzeHyperspectralImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
