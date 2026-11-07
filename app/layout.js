import './globals.css';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

export const metadata = {
  title: 'SyncSpace — Real-Time Collaborative Workspace Engine',
  description: 'Next.js 16 and Socket.io collaborative document synchronization, live multi-user cursor tracking, and team channels.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>
      <body className="font-sans bg-slate-50 min-h-screen antialiased text-slate-800">
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
      </body>
    </html>
  );
}
