
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pantoneCategories, type PantoneColor } from '@/lib/pantone-colors';

const ColorSwatch = ({ color }: { color: PantoneColor }) => (
  <Card className="overflow-hidden shadow-md">
    <div style={{ backgroundColor: color.hex }} className="h-24 w-full" />
    <CardContent className="p-3">
      <p className="font-bold text-sm truncate" title={color.name}>{color.name}</p>
      <p className="text-xs text-muted-foreground">{color.cmyk}</p>
    </CardContent>
  </Card>
);

export default function PantoneGuidePage() {
  if (!pantoneCategories || pantoneCategories.length === 0) {
    return <div>No Pantone colors found.</div>;
  }

  const halfwayIndex = Math.ceil(pantoneCategories.length / 2);

  return (
    <div className="flex-1 w-full p-4 md:p-8">
      <CardHeader className="p-0 mb-8">
        <CardTitle className="text-3xl">Pantone Color Guide</CardTitle>
        <CardDescription>A reference guide for Pantone colors, parsed from the official guide.</CardDescription>
      </CardHeader>
      <Tabs defaultValue={pantoneCategories[0].name} className="w-full">
        <TabsList className="grid grid-cols-2 h-auto gap-1">
            {pantoneCategories.map((category, index) => (
            <TabsTrigger 
                key={category.name} 
                value={category.name}
                disabled={index >= halfwayIndex}
            >
                {category.name}
            </TabsTrigger>
            ))}
        </TabsList>
        {pantoneCategories.map(category => (
            <TabsContent key={category.name} value={category.name} className="mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4">
                    {category.colors.map(color => (
                        <ColorSwatch key={color.name} color={color} />
                    ))}
                </div>
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
