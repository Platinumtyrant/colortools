
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CategorizedPalette } from '@/lib/palette-parser';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PALETTES_PER_PAGE = 24; // 8 rows * 3 columns on large screens

interface InspirationClientPageProps {
  allPalettes: CategorizedPalette[];
}

export function InspirationClientPage({ allPalettes }: InspirationClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [visibleCount, setVisibleCount] = useState(PALETTES_PER_PAGE);

  const handleLoadPalette = (palette: { name: string; colors: string[] }) => {
    const newPaletteData = {
      id: Date.now(),
      name: palette.name,
      colors: palette.colors,
    };
    localStorage.setItem('palette_to_load', JSON.stringify(newPaletteData));
    toast({
      title: 'Palette Ready!',
      description: `"${palette.name}" sent to the Palette Builder.`,
    });
    router.push('/');
  };

  const visiblePalettes = allPalettes.slice(0, visibleCount);
  let lastCategory = '';

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
        {visiblePalettes.map((palette, index) => {
            const showCategoryHeader = palette.category !== lastCategory;
            lastCategory = palette.category;
            return (
              <React.Fragment key={`${palette.name}-${index}`}>
                {showCategoryHeader && (
                  <h2 className="text-2xl font-semibold tracking-tight mt-8 pb-2 border-b col-span-full">
                    {palette.category}
                  </h2>
                )}
                <div className="group" onClick={() => handleLoadPalette(palette)}>
                    <p className="text-sm font-medium mb-2 truncate" title={palette.name}>{palette.name}</p>
                    <div className="flex h-16 w-full cursor-pointer overflow-hidden rounded-md border-2 border-transparent transition-all group-hover:border-primary">
                    {palette.colors.map((color, colorIndex) => (
                        <div key={colorIndex} className="flex-1" style={{ backgroundColor: color }} />
                    ))}
                    </div>
                </div>
              </React.Fragment>
            );
        })}
        </div>

      {visibleCount < allPalettes.length && (
        <div className="text-center mt-12">
          <Button onClick={() => setVisibleCount(prev => prev + PALETTES_PER_PAGE)}>Load More</Button>
        </div>
      )}
    </div>
  );
}
