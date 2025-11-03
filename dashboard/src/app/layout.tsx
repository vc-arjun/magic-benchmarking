import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Performance Dashboard',
  description: 'Magic Checkout Performance Analytics Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <div className="flex">
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
