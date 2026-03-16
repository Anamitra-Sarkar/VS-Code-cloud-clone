import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Codespace-OP | Cloud IDE Powered by AI',
  description:
    'A cloud-based VS Code experience with built-in AI assistance, real-time collaboration, and seamless Git integration.',
  keywords: ['cloud IDE', 'VS Code', 'AI coding', 'codespaces', 'online editor'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-vscode-bg text-vscode-text`}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'bg-vscode-menu-bg text-vscode-text border border-vscode-border',
              duration: 4000,
              style: {
                background: '#2d2d2d',
                color: '#cccccc',
                border: '1px solid #3c3c3c',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
