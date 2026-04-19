import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { ThemeProvider } from '@/lib/ThemeContext';


export const metadata: Metadata = {
  title: 'TCRS — Transparent Civic Reporting System',
  description: 'Report civic issues, track resolutions, build trust.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          </Providers>
      </body>
    </html>
  );
}