"use client";
import { ContrastChecker } from '@/components/colors/ContrastChecker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ContrastCheckerPage() {
  return (
    <main className="flex-1 w-full p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
                <CardTitle>Contrast Checker</CardTitle>
                <CardDescription>Check color contrast for WCAG compliance.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContrastChecker />
            </CardContent>
          </Card>
        </div>
    </main>
  );
}
