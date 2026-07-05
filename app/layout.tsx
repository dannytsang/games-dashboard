import type { Metadata } from 'next';
import './globals.css';
import Nav from './components/Nav';

export const metadata: Metadata = {
  title: 'Games Dashboard',
  description: 'Private games dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Nav />
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
