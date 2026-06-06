'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[520px] p-8 overflow-hidden flex flex-col">
        <DialogHeader className="p-0 pb-6 text-left">
          <DialogTitle>Privacy & Data Protection</DialogTitle>
          <DialogDescription>How Aven protects your personal information and coaching history.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-left text-[#1a1a1a] text-[13.5px] font-sans leading-relaxed select-none max-h-[300px]">
          <div>
            <h4 className="font-bold text-[14px] text-black mb-1">1. Absolute Confidentiality</h4>
            <p className="text-black/75">
              Your dreams, goals, and daily struggles are personal. Aven never sells or shares your habit data, metrics, or chat histories with third-party advertisers or databases.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[14px] text-black mb-1">2. Secure Infrastructure</h4>
            <p className="text-black/75">
              Your profile and coaching metrics are stored securely on encrypted database instances managed by Supabase, protected with industry-standard Row-Level Security (RLS) policies.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[14px] text-black mb-1">3. Privacy-First AI Processing</h4>
            <p className="text-black/75">
              Interaction transcripts sent to processing LLMs (like Google Gemini and OpenAI) are sent over secure HTTPS connections. They are not used by model providers to train public foundation models.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[14px] text-black mb-1">4. Ownership and Control</h4>
            <p className="text-black/75">
              You own your data. At any time in your Settings panel, you can instantly export your complete chat and plan history in JSON format, or choose to delete your plan and history permanently from our database.
            </p>
          </div>
        </div>

        <DialogFooter className="p-0 pt-6 mt-4 border-t border-black/5">
          <Button variant="default" onClick={onClose} className="w-full py-3 h-auto">
            I understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
