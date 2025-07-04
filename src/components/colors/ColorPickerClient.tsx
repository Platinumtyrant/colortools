"use client";

import React from 'react';
import { PhotoshopPicker, type ColorResult } from 'react-color';

interface ColorPickerClientProps {
  color: string;
  onChange: (color: string) => void;
  onAccept: () => void;
  onCancel: () => void;
}

export default function ColorPickerClient({ color, onChange, onAccept, onCancel }: ColorPickerClientProps) {
  const handleChangeComplete = (colorResult: ColorResult) => {
    onChange(colorResult.hex);
  };

  return (
    <PhotoshopPicker
      color={color}
      header="Color Picker"
      onChangeComplete={handleChangeComplete}
      onAccept={onAccept}
      onCancel={onCancel}
    />
  );
}
