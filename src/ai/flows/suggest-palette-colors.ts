// src/ai/flows/suggest-palette-colors.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting colors for a user-selected palette using AI.
 *
 * - suggestPaletteColors - A function that takes a base color and the number of colors desired in the palette and returns a list of suggested colors.
 * - SuggestPaletteColorsInput - The input type for the suggestPaletteColors function.
 * - SuggestPaletteColorsOutput - The return type for the suggestPaletteColors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPaletteColorsInputSchema = z.object({
  baseColor: z.string().describe('The base color for the palette, in hex code format (e.g., #FF9800).'),
  numColors: z.number().describe('The number of colors to include in the palette (including the base color).'),
});
export type SuggestPaletteColorsInput = z.infer<typeof SuggestPaletteColorsInputSchema>;

const SuggestPaletteColorsOutputSchema = z.object({
  colors: z.array(z.string()).describe('An array of suggested colors in hex code format.'),
});
export type SuggestPaletteColorsOutput = z.infer<typeof SuggestPaletteColorsOutputSchema>;

export async function suggestPaletteColors(input: SuggestPaletteColorsInput): Promise<SuggestPaletteColorsOutput> {
  return suggestPaletteColorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPaletteColorsPrompt',
  input: {schema: SuggestPaletteColorsInputSchema},
  output: {schema: SuggestPaletteColorsOutputSchema},
  prompt: `You are an AI color palette assistant. The user will provide you with a base color and the number of colors they want in their palette. You will return a JSON array of hex color codes.

  Apply color theory principles to create a balanced and visually appealing palette. Consider complementary, analogous, triadic, and other color harmonies to generate suggestions.

  Ensure that the base color, {{{baseColor}}}, is always included in the resulting palette.

  Return ONLY a JSON array of hex color codes, and nothing else.

  Number of colors: {{{numColors}}}
`,
});

const suggestPaletteColorsFlow = ai.defineFlow(
  {
    name: 'suggestPaletteColorsFlow',
    inputSchema: SuggestPaletteColorsInputSchema,
    outputSchema: SuggestPaletteColorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

