import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect Telegram — Daylon',
  description: 'Connect your Telegram account to receive daily task reminders.',
};

export default function ConnectPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="max-w-md w-full px-6 text-center space-y-6">
        <h1 className="text-3xl font-bold text-foreground">
          Get daily reminders
        </h1>
        <p className="text-muted-foreground">
          Connect Telegram and Daylon will send you your daily task every morning,
          straight to your phone.
        </p>
        {/* TelegramConnect component will be mounted here */}
      </div>
    </main>
  );
}
