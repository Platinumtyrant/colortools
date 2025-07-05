
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pantoneProColors, yellowAndOrangeColors, orangeAndRedColors, pinkAndPurpleColors, blueAndVioletColors, cyanAndGreenColors, yellowAndGreenColors, grayColors, type PantoneColor } from '@/lib/pantone-colors';

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
  return (
    <div className="flex-1 w-full p-4 md:p-8">
      <CardHeader className="p-0 mb-8">
        <CardTitle className="text-3xl">Pantone Color Bridge Guide</CardTitle>
        <CardDescription>A reference guide for comparing Pantone colors to their CMYK and digital equivalents.</CardDescription>
      </CardHeader>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Process Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {pantoneProColors.map(color => (
            <ColorSwatch key={color.name} color={color} />
          ))}
        </div>
      </section>

      <Tabs defaultValue="yellow-orange" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 h-auto">
          <TabsTrigger value="yellow-orange">Yellows &amp; Oranges</TabsTrigger>
          <TabsTrigger value="orange-red">Oranges &amp; Reds</TabsTrigger>
          <TabsTrigger value="pink-purple">Pinks &amp; Purples</TabsTrigger>
          <TabsTrigger value="blue-violet">Blues &amp; Violets</TabsTrigger>
          <TabsTrigger value="cyan-green">Cyans &amp; Greens</TabsTrigger>
          <TabsTrigger value="yellow-green">Yellows &amp; Greens</TabsTrigger>
          <TabsTrigger value="grays">Grays</TabsTrigger>
        </TabsList>
        <TabsContent value="yellow-orange" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-11 gap-4">
            {yellowAndOrangeColors.map(color => (
              <ColorSwatch key={color.name} color={color} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="orange-red" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-4">
                {orangeAndRedColors.map(color => (
                <ColorSwatch key={color.name} color={color} />
                ))}
            </div>
        </TabsContent>
        <TabsContent value="pink-purple" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-4">
                {pinkAndPurpleColors.map(color => (
                <ColorSwatch key={color.name} color={color} />
                ))}
            </div>
        </TabsContent>
        <TabsContent value="blue-violet" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-4">
                {blueAndVioletColors.map(color => (
                <ColorSwatch key={color.name} color={color} />
                ))}
            </div>
        </TabsContent>
        <TabsContent value="cyan-green" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-4">
                {cyanAndGreenColors.map(color => (
                <ColorSwatch key={color.name} color={color} />
                ))}
            </div>
        </TabsContent>
        <TabsContent value="yellow-green" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-10 gap-4">
                {yellowAndGreenColors.map(color => (
                <ColorSwatch key={color.name} color={color} />
                ))}
            </div>
        </TabsContent>
        <TabsContent value="grays" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                {grayColors.map(color => (
                <ColorSwatch key={color.name} color={color} />
                ))}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

  