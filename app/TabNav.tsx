"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Upload', href: '/upload' },
  { label: 'Generate', href: '/generate' },
  { label: 'Settings', href: '/settings' },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-4 border-b border-gray-200 mb-8 bg-white rounded-t-xl shadow-sm overflow-x-auto">
      {tabs.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1 px-4 py-2 transition-colors duration-150 text-xs font-semibold uppercase tracking-wide focus:outline-none
              ${active ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 border-b-2 border-transparent hover:text-blue-600 hover:bg-blue-50'}`}
            aria-current={active ? 'page' : undefined}
          >
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
