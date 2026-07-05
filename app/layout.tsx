import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Games Dashboard',
  description: 'Private games dashboard — placeholder',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
