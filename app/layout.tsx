import { TabNav } from './TabNav';
import { EnhancedErrorBoundary } from './EnhancedErrorBoundary';
import { ToastProvider } from './ToastProvider';
import { MonitoringProvider } from './MonitoringProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MonitoringProvider>
          <EnhancedErrorBoundary>
            <TabNav />
            {children}
            <ToastProvider />
          </EnhancedErrorBoundary>
        </MonitoringProvider>
      </body>
    </html>
  )
}