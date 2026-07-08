// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Generates a report summarizing potential risks to crops and recommended actions, including severity levels and specific issues detected.
 *
 * - generateRiskAssessmentReport - A function that generates the risk assessment report.
 * - GenerateRiskAssessmentReportInput - The input type for the generateRiskAssessmentReport function.
 * - GenerateRiskAssessmentReportOutput - The return type for the generateRiskAssessmentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRiskAssessmentReportInputSchema = z.object({
  imageData: z.string().describe("A photo of a plant leaf, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  location: z.string().describe('The geographical location of the field.'),
});
export type GenerateRiskAssessmentReportInput = z.infer<typeof GenerateRiskAssessmentReportInputSchema>;

const GenerateRiskAssessmentReportOutputSchema = z.object({
  report: z.string().describe('A report summarizing potential risks to the crops, including specific issues detected, severity levels, and recommended actions.'),
});
export type GenerateRiskAssessmentReportOutput = z.infer<typeof GenerateRiskAssessmentReportOutputSchema>;

export async function generateRiskAssessmentReport(input: GenerateRiskAssessmentReportInput): Promise<GenerateRiskAssessmentReportOutput> {
  return generateRiskAssessmentReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRiskAssessmentReportPrompt',
  input: {schema: GenerateRiskAssessmentReportInputSchema},
  output: {schema: GenerateRiskAssessmentReportOutputSchema},
  prompt: `You are an expert agricultural advisor. You will generate a report summarizing potential risks to crops and recommended actions based on the provided image and location. From the image, identify the crop type and any visible diseases or stress. From the location, infer likely environmental conditions (weather, soil type).

Combine these observations to generate a comprehensive risk assessment report. The report must include:
1.  **Identified Crop Type**: What crop is in the image.
2.  **Visible Issues**: Any diseases, pests, or stress signs visible in the image.
3.  **Inferred Environmental Risks**: Potential risks based on the location (e.g., high humidity leading to fungal risk, common local pests).
4.  **Severity Levels**: Assign a severity level (Low, Medium, High) to each identified risk.
5.  **Recommended Actions**: Concrete steps the farmer should take to mitigate these risks.

Image: {{media url=imageData}}
Location: {{{location}}}

Generate a comprehensive risk assessment report.`,
});

const generateRiskAssessmentReportFlow = ai.defineFlow(
  {
    name: 'generateRiskAssessmentReportFlow',
    inputSchema: GenerateRiskAssessmentReportInputSchema,
    outputSchema: GenerateRiskAssessmentReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
