
import React from 'react';
import { pantoneCategories } from '@/lib/pantone-colors';
import { PantoneGuideClientPage } from '@/components/pantone/PantoneGuideClientPage';

export default function PantoneGuidePage() {
    // The pantoneCategories are now fetched on the server at build time
    // and passed as a prop to the client component.
    return (
        <PantoneGuideClientPage pantoneCategories={pantoneCategories} />
    );
}
