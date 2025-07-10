# Color Tools

This is a comprehensive color utility application built with Next.js and deployed on Firebase. It provides a suite of tools for designers, developers, and artists to create, analyze, and manage color palettes and gradients.

## Technologies Used

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/)
- **Component Library**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Color Manipulation**: `colord`, `chroma-js`, `color-namer`
- **State Management**: React Context API
- **Desktop Wrapper**: [Electron](https://www.electronjs.org/)

## Pages & Features

This application includes several powerful tools to assist with all aspects of color work.

### 1. Palette Builder (Home)
The central hub of the application where users can:
- **Generate Palettes**: Create color schemes using various generation methods like Analogous, Triadic, Complementary, Tints, Shades, and Tones.
- **Edit & Refine**: Fine-tune colors using a color wheel and HSL sliders. Lock specific colors to keep them while regenerating the rest of the palette.
- **Analyze Palettes**:
    - **Contrast Checker**: Test text and background color combinations for WCAG AA and AAA compliance.
    - **Colorblind Simulation**: View the palette as it would appear to users with different types of color vision deficiencies (Protanopia, Deuteranopia, etc.).
    - **Harmony Analysis**: Visualize the color relationships on a color wheel.
- **Save**: Save palettes and individual colors to the user's personal library.

### 2. Gradient Builder
- A canvas-based tool for creating beautiful, complex mesh gradients.
- Add, move, and customize color points on a grid to blend colors smoothly.
- Export the final gradient as a high-resolution PNG image.

### 3. Camera Identifier
- Use your device's camera or upload an image to identify colors in real-time.
- Features include a crosshair for precise selection, the ability to freeze the frame, and zoom functionality for accurate color picking.

### 4. Pre-built Palettes
- A gallery of professionally curated color palettes to spark creativity and provide a starting point for new projects.
- Palettes are sorted by category (e.g., Warm, Cool, Brands, Flags) for easy browsing.

### 5. Pantone Guide
- A comprehensive reference for official Pantone color systems.
- Browse both the Solid Coated (for graphic design) and FHI (Fashion, Home + Interiors) color libraries.

### 6. Library
- A personal space to manage all saved assets.
- View and organize saved individual colors and full palettes.
- Load saved palettes back into the builder for further editing.
- Export saved palettes in various formats (SVG, PNG, JSON Tokens).
