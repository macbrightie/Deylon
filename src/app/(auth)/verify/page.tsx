import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyClient } from '@/components/auth/VerifyClient';

export const metadata: Metadata = {
  title: 'Verify your email — Daylon',
  description: 'Confirm your magic link to access Daylon.',
};

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F5EE]">
      <div className="bg-white rounded-[24px] border border-black/5 p-8 max-w-[400px] w-full shadow-lg">
        <Suspense fallback={
          <div className="text-center py-6 space-y-4">
            <div className="flex justify-center">
              <svg className="animate-spin w-10 h-10 text-[#104d3b]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <p className="text-[14px] text-[#6f6f77] font-sans">Syncing authentication engine...</p>
          </div>
        }>
          <VerifyClient />
        </Suspense>
      </div>
    </main>
  );
}
