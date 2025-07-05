
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PaletteGroup } from '@/lib/palette-parser';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const INITIAL_GROUPS_TO_SHOW = 1;

interface InspirationClientPageProps {
  allPaletteGroups: PaletteGroup[];
}

export function InspirationClientPage({ allPaletteGroups }: InspirationClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [groupsToShow, setGroupsToShow] = useState(INITIAL_GROUPS_TO_SHOW);

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

  const visibleGroups = allPaletteGroups.slice(0, groupsToShow);

  return (
    <div className="space-y-12">
      {visibleGroups.map((group) => (
        <section key={group.imageName}>
          <h2 className="text-2xl font-semibold tracking-tight mt-8 pb-2 border-b">{group.imageName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mt-6">
            {group.palettes.map((palette, index) => (
              <div key={`${palette.name}-${index}`} className="group" onClick={() => handleLoadPalette(palette)}>
                <p className="text-sm font-medium mb-2 truncate" title={palette.name}>{palette.name}</p>
                <div className="flex h-16 w-full cursor-pointer overflow-hidden rounded-md border-2 border-transparent transition-all group-hover:border-primary">
                  {palette.colors.map((color, colorIndex) => (
                    <div key={colorIndex} className="flex-1" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {groupsToShow < allPaletteGroups.length && (
        <div className="text-center mt-12">
          <Button onClick={() => setGroupsToShow(prev => prev + 1)}>Load More</Button>
        </div>
      )}
    </div>
  );
}
