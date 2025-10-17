"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocumentArrowUpIcon, SparklesIcon } from '@heroicons/react/24/solid';

const tabs = [
  { label: 'Upload', href: '/upload', icon: DocumentArrowUpIcon },
  { label: 'Generate', href: '/generate', icon: SparklesIcon },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-4 border-b border-gray-200 mb-8 bg-white rounded-t-xl shadow-sm overflow-x-auto">
      {tabs.map(tab => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-6 py-3 transition-colors duration-150 font-medium text-base focus:outline-none
              ${active ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 border-b-2 border-transparent hover:text-blue-600 hover:bg-blue-50'}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
