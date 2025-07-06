
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PantoneCategory, PantoneColor } from '@/lib/pantone-colors';
import { ColorBox } from '@/components/colors/ColorBox';

const ColorSwatch = ({ color }: { color: PantoneColor }) => (
    <div className="w-40">
        <ColorBox
            color={color.hex}
            name={color.name}
            info={color.cmyk}
            variant="compact"
        />
    </div>
);

interface PantoneGuideClientPageProps {
  pantoneCategories: PantoneCategory[];
}

export function PantoneGuideClientPage({ pantoneCategories }: PantoneGuideClientPageProps) {
  if (!pantoneCategories || pantoneCategories.length === 0) {
    return <div>No Pantone colors found.</div>;
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col">
      <div className="flex-grow">
        <CardHeader className="p-0 mb-8">
          <CardTitle className="text-3xl">Pantone Color Guide</CardTitle>
          <CardDescription>A reference guide for Pantone colors, parsed from the official guide.</CardDescription>
        </CardHeader>
        <Tabs defaultValue={pantoneCategories[0].name} className="w-full">
          <TabsList className="h-auto flex-wrap justify-start">
            {pantoneCategories.map((category) => (
              <TabsTrigger key={category.name} value={category.name}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {pantoneCategories.map(category => (
              <TabsContent key={category.name} value={category.name} className="mt-6">
                  <div className="flex flex-wrap gap-4">
                      {category.colors.map((color, index) => (
                          <ColorSwatch key={`${color.name}-${index}`} color={color} />
                      ))}
                  </div>
              </TabsContent>
          ))}
        </Tabs>
      </div>

      <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground space-y-2">
        <p>PANTONE® Colors displayed here may not match PANTONE-identified standards. Consult current PANTONE Color Publications for accurate color.</p>
        <p>PANTONE® and other Pantone, Inc. trademarks are the property of Pantone, Inc. © Pantone, Inc., 2005. All rights reserved.</p>
        <p>Hardcopies of PANTONE Color Charts and reproductions thereof MAY NOT BE SOLD in any form.</p>
        <p>Pantone, Inc. is not responsible for any modifications made to such Charts which have not been approved by Pantone, Inc. PC = four-color Process (process) simulations of solid colors Coated (stock)</p>
      </footer>
    </div>
  );
}
