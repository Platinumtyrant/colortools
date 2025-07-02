"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  width: string;
  height: string;
  text: string;
  className?: string;
  "data-ai-hint"?: string;
}

export const ImagePlaceholder = ({ width, height, text, className, "data-ai-hint": dataAiHint }: ImagePlaceholderProps) => (
  <Image
    src={`https://placehold.co/${width}x${height}/323232/ffffff`}
    alt={text}
    width={parseInt(width)}
    height={parseInt(height)}
    className={cn("w-full h-auto rounded-md", className)}
    data-ai-hint={dataAiHint}
  />
);
