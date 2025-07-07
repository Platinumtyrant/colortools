
"use client";

import React from 'react';
import { prebuiltGradients } from '@/lib/gradients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PrebuiltGradientsProps {
  onSelectGradient: (colors: string[]) => void;
  className?: string;
}

export const PrebuiltGradients = ({ onSelectGradient, className }: PrebuiltGradientsProps) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Pre-built Gradients</CardTitle>
        <CardDescription>Select a gradient to use as a starting point for your mesh.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 scroll-fade">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pr-4">
            {prebuiltGradients.map((gradient) => (
              <div
                key={gradient.name}
                onClick={() => onSelectGradient(gradient.colors)}
                className="cursor-pointer group"
                title={gradient.name}
              >
                <div
                  className="w-full aspect-square rounded-full shadow-md transition-transform group-hover:scale-105 border"
                  style={{ background: `linear-gradient(45deg, ${gradient.colors.join(', ')})` }}
                />
                <p className="text-center text-xs mt-2 text-muted-foreground truncate">{gradient.name}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
