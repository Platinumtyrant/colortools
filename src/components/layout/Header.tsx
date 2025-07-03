import Link from 'next/link';

export function Header() {
  return (
    <header className="w-full bg-card py-4 shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white">
          Palette Prodigy
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Palette Builder
          </Link>
          <Link href="/scale" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Scale Generator
          </Link>
          <Link href="/mesh-gradient" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Gradient Builder
          </Link>
          <Link href="/contrast-checker" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Contrast Checker
          </Link>
          <Link href="/library" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Library
          </Link>
          <Link href="/dashboard-example" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Dashboard Example
          </Link>
        </nav>
      </div>
    </header>
  );
}
