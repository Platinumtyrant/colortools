
"use client";
import { GradientMeshBuilder } from '@/components/colors/GradientMeshBuilder';
import { PrebuiltGradients } from '@/components/colors/PrebuiltGradients';
import { useState } from 'react';

export default function MeshGradientPage() {
  const [initialColors, setInitialColors] = useState<string[] | undefined>();

  return (
    <main className="flex-1 w-full p-4 md:p-8 space-y-8">
        <GradientMeshBuilder key={initialColors?.join('-')} initialColors={initialColors} />
        <PrebuiltGradients onSelectGradient={setInitialColors} />
    </main>
  );
}
