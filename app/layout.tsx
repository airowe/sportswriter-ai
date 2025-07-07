import { TabNav } from './TabNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <TabNav />
        {children}
      </body>
    </html>
  )
}