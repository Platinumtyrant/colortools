
import { getPrebuiltPalettes } from '@/lib/palette-parser';
import { InspirationClientPage } from '@/components/palettes/InspirationClientPage';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function InspirationPage() {
    const paletteGroups = await getPrebuiltPalettes();

    return (
        <div className="flex-1 w-full p-4 md:p-8">
            <CardHeader className="p-0 mb-8">
                <CardTitle className="text-3xl">Inspiration</CardTitle>
                <CardDescription>A gallery of pre-built palettes to spark your creativity. Click a palette to start editing it in the builder.</CardDescription>
            </CardHeader>
            <InspirationClientPage allPaletteGroups={paletteGroups} />
        </div>
    );
}
