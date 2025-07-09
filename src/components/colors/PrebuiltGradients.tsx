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
        <ScrollArea className="h-[30rem]">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-4 pr-4">
            {prebuiltGradients.map((gradient) => (
              <div
                key={gradient.name}
                onClick={() => onSelectGradient(gradient.colors)}
                className="cursor-pointer group"
                title={gradient.name}
              >
                <div
                  className="w-full aspect-[2.35/1] rounded-md shadow-md transition-transform group-hover:scale-105 border"
                  style={{ background: `linear-gradient(45deg, ${gradient.colors.join(', ')})` }}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
