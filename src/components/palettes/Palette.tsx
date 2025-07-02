"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PaletteProps {
  palette: string[];
  actions: React.ReactNode;
}

export const Palette = ({ palette, actions }: PaletteProps) => {
  const { toast } = useToast();

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color).then(() => {
      toast({
        title: "Color Copied!",
        description: `${color} has been copied to your clipboard.`
      });
    });
  };

  return (
    <Card className="bg-card/50 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex h-32">
          {palette.map((color) => (
            <div
              key={color}
              className="flex-1 transition-all hover:flex-[2]"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="grid p-4" style={{ gridTemplateColumns: `repeat(${palette.length}, 1fr)` }}>
          {palette.map((color) => (
            <div key={color} className="text-center">
              <button 
                onClick={() => handleCopyColor(color)} 
                className="font-mono text-sm text-muted-foreground hover:text-foreground"
                title={`Copy ${color}`}
              >
                {color.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 p-4 pt-0">
        {actions}
      </CardFooter>
    </Card>
  );
};
