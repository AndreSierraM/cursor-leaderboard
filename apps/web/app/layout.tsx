import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from './i18n';
import Shell from './Shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata = {
  title: 'Cursor Leaderboard',
  description: 'Open-source, opt-in usage ranking for Cursor public profiles.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <LanguageProvider>
          <Shell>{children}</Shell>
        </LanguageProvider>
      </body>
    </html>
  );
}
