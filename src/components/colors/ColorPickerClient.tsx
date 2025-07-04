"use client";

import React from 'react';
import { SketchPicker, type ColorResult } from 'react-color';

interface ColorPickerClientProps {
  color: string;
  onChange: (color: string) => void;
}

export default function ColorPickerClient({ color, onChange }: ColorPickerClientProps) {
  const handleChangeComplete = (colorResult: ColorResult) => {
    onChange(colorResult.hex);
  };

  return (
    <SketchPicker
      color={color}
      onChangeComplete={handleChangeComplete}
      styles={{
        default: {
          picker: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            boxShadow: 'none',
          },
        }
      }}
    />
  );
}
