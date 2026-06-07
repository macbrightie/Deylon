import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { CSPostHogProvider } from '@/lib/analytics/posthog';

const recoleta = localFont({
  src: '../../public/fonts/fonnts.com-recoleta-medium.otf',
  variable: '--font-recoleta',
  display: 'swap',
});

const haffer = localFont({
  src: [
    {
      path: '../../public/haffer-font-family/Haffer-TRIAL-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/haffer-font-family/Haffer-TRIAL-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/haffer-font-family/Haffer-TRIAL-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-haffer',
  display: 'swap',
});

const hafferXHMono = localFont({
  src: [
    {
      path: '../../public/haffer-font-family/HafferXHMono-TRIAL-Medium.otf',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-haffer-xh-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Daylon — Your AI Life Planner',
  description:
    'Daylon turns your biggest goals into a personalised, day-by-day action plan — powered by AI.',
  openGraph: {
    title: 'Daylon — Your AI Life Planner',
    description:
      'Conversational onboarding, personalised AI life plans, and daily task reminders via Telegram.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${recoleta.variable} ${haffer.variable} ${hafferXHMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <CSPostHogProvider>
          {children}
        </CSPostHogProvider>
      </body>
    </html>
  );
}
