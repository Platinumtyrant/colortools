
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cyanAndGreenColors, type PantoneColor } from '@/lib/pantone-colors';

const ColorSwatch = ({ color }: { color: PantoneColor }) => (
  <Card className="overflow-hidden shadow-md">
    <div style={{ backgroundColor: color.hex }} className="h-24 w-full" />
    <CardContent className="p-3">
      <p className="font-bold text-sm truncate" title={color.name}>{color.name}</p>
      <p className="text-xs text-muted-foreground">{color.cmyk}</p>
    </CardContent>
  </Card>
);

export default function PantoneCyanGreenPage() {
  return (
    <div className="flex-1 w-full p-4 md:p-8">
      <CardHeader className="p-0 mb-8">
        <CardTitle className="text-3xl">Pantone Guide: Cyans & Greens</CardTitle>
        <CardDescription>A reference guide for Pantone colors in the cyan and green families.</CardDescription>
      </CardHeader>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-4">
        {cyanAndGreenColors.map(color => (
          <ColorSwatch key={color.name} color={color} />
        ))}
      </div>
    </div>
  );
}
