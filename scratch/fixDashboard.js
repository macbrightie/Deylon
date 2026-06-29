const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/dashboard/page.tsx', 'utf8');

const injectionCode = `const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleToggleWhatsApp = () => {
    if (whatsappConnected) {
      // Logic to disconnect could go here if needed
    } else {
      setIsWhatsAppModalOpen(true);
      setShowSettingsModal(false); // Close settings modal so WhatsApp modal can show cleanly
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
  'const [showSettingsModal, setShowSettingsModal] = useState(false);',
  injectionCode
);

fs.writeFileSync('src/app/(dashboard)/dashboard/page.tsx', code, 'utf8');
console.log('Fixed handlers');
