import { TabNav } from './TabNav';

import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 antialiased">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <TabNav />
          {children}
        </div>
      </body>
    </html>
  )
}