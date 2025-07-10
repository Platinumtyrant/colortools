
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPrebuiltPalettes } from '@/lib/palette-server';
import { InspirationClientPage } from '@/components/palettes/InspirationClientPage';

export default async function PreBuiltPalettesPage() {
    const allPalettes = await getPrebuiltPalettes();

    return (
        <div className="flex-1 w-full p-4 md:p-8">
            <CardHeader className="p-0 mb-8">
                <CardTitle className="text-3xl">Pre-built Palettes</CardTitle>
                <CardDescription>A gallery of pre-built palettes to spark your creativity, sorted by color. Click a palette to add it to your library.</CardDescription>
            </CardHeader>
            <InspirationClientPage allPalettes={allPalettes} />
        </div>
    );
}
