const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/dashboard/page.tsx', 'utf8');

// 1. Define WhatsAppConnectModal before default function Dashboard
const modalCode = `
// ─── WhatsApp Connect Modal ───────────────────────────────────────────────────
function WhatsAppConnectModal({
  isOpen,
  onClose,
  onSaveAndVerify
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndVerify: (phone: string) => Promise<void>;
}) {
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setPhone('');
  }, [isOpen]);

  const handleSave = async () => {
    if (!phone.trim()) return;
    setIsSaving(true);
    await onSaveAndVerify(phone.trim());
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[420px] bg-[#1a1a1a] text-white border-white/10 rounded-[20px] p-8">
        <DialogHeader>
          <DialogTitle className="text-[22px] font-sans font-medium text-white mb-2">
            Start 7-Day WhatsApp Trial
          </DialogTitle>
          <DialogDescription className="text-[14px] text-white/60 font-sans leading-relaxed">
            Enter your WhatsApp number with the country code (e.g. +13203732683). You'll be redirected to WhatsApp to send a quick verification message.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsappPhone" className="text-white/80 font-sans text-[13px]">WhatsApp Number</Label>
            <input
              id="whatsappPhone"
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#2A2A2E] border border-white/10 text-white rounded-[12px] px-4 py-3 font-sans text-[15px] outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        <DialogFooter className="mt-8 sm:justify-start">
          <Button 
            onClick={handleSave}
            disabled={isSaving || !phone.trim()}
            className="w-full bg-white text-[#1a1a1a] hover:bg-white/90 rounded-[12px] py-6 text-[15px] font-medium transition-all cursor-pointer"
          >
            {isSaving ? 'Connecting...' : 'Save & Verify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard`;

code = code.replace('export default function Dashboard', modalCode);

// 2. Add state inside Dashboard
code = code.replace(
  'const [whatsappConnected, setWhatsappConnected] = useState(false);',
  `const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);`
);

// 3. Add handler inside Dashboard
const handlerCode = `
  const handleToggleWhatsApp = () => {
    if (whatsappConnected) {
      // Logic to disconnect could go here if needed
    } else {
      setIsWhatsAppModalOpen(true);
      setIsSettingsOpen(false); // Close settings modal so WhatsApp modal can show cleanly
    }
  };

  const handleSaveWhatsApp = async (phone: string) => {
    if (!userProfile) return;
    
    // 1. Update Supabase
    const { error } = await supabase
      .from('users')
      .update({ whatsapp_number: phone })
      .eq('id', userProfile.id);

    if (error) {
      console.error('Error saving whatsapp number:', error);
      return;
    }

    setWhatsappConnected(true);
    setIsWhatsAppModalOpen(false);

    // 2. Redirect to wa.me with the join code
    const twilioNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+13203732683';
    const joinCode = process.env.NEXT_PUBLIC_TWILIO_JOIN_CODE || 'join purple-monkey'; 
    const waUrl = \`https://wa.me/\${twilioNumber.replace('+', '')}?text=\${encodeURIComponent(joinCode)}\`;
    
    window.open(waUrl, '_blank');
  };
`;

code = code.replace(
  'const handleConnectTelegram = async () => {',
  handlerCode + '\n  const handleConnectTelegram = async () => {'
);

// 4. Update the SettingsModal props to use handleToggleWhatsApp instead of setWhatsappConnected
code = code.replace(
  `onToggleWhatsApp={() => setWhatsappConnected(!whatsappConnected)}`,
  `onToggleWhatsApp={handleToggleWhatsApp}`
);

// We need to do it twice since SettingsModal might be called in different places
code = code.replace(
  `onToggleWhatsApp={() => setWhatsappConnected(!whatsappConnected)}`,
  `onToggleWhatsApp={handleToggleWhatsApp}`
);


// 5. Add WhatsAppConnectModal to the return block
// Usually it's returned alongside SettingsModal
code = code.replace(
  '<SettingsModal',
  `<WhatsAppConnectModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        onSaveAndVerify={handleSaveWhatsApp}
      />
      <SettingsModal`
);

fs.writeFileSync('src/app/(dashboard)/dashboard/page.tsx', code, 'utf8');
console.log('WhatsApp UI logic added successfully');
