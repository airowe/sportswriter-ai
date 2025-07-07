"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Upload', href: '/upload' },
  { label: 'Generate', href: '/generate' },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: 'flex', gap: 16, borderBottom: '1px solid #ccc', marginBottom: 24 }}>
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          style={{
            padding: '8px 24px',
            textDecoration: 'none',
            color: pathname === tab.href ? '#0070f3' : '#222',
            borderBottom: pathname === tab.href ? '2px solid #0070f3' : '2px solid transparent',
            fontWeight: pathname === tab.href ? 'bold' : 'normal',
            background: 'none'
          }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
