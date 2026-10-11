import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TERRA · Enterprise Waste Intelligence & Material Audit Platform',
  description:
    'AI-driven computer vision layer converting physical waste streams into structured, auditable material composition, contamination QA, hazard sentinel, and robot-ready analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Satisfy-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Satisfy&family=Allura&family=Italianno&display=swap"
        />
      </head>
      <body className="bg-[#04080b] text-[#f4f6fa] antialiased selection:bg-[#d4af37]/30 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
