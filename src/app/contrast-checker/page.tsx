"use client";
import { ContrastChecker } from '@/components/colors/ContrastChecker';

export default function ContrastCheckerPage() {
  return (
    <main className="flex-1 w-full p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <ContrastChecker />
        </div>
    </main>
  );
}
