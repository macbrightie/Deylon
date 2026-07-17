const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const fromPhone = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
const toPhone = '+2348146257278';

async function main() {
  const fromWhatsApp = fromPhone.startsWith('whatsapp:') ? fromPhone : `whatsapp:${fromPhone}`;
  const toWhatsApp = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  
  console.log(`Sending from ${fromWhatsApp} to ${toWhatsApp}`);
  
  try {
    const msg = await client.messages.create({
      body: '🧪 Deylon test message — if you see this, WhatsApp is connected correctly!',
      from: fromWhatsApp,
      to: toWhatsApp,
    });
    console.log('✅ Message sent! SID:', msg.sid, '| Status:', msg.status);
  } catch (err) {
    console.error('❌ Failed to send:', err.message);
    console.error('Error code:', err.code);
  }
}

main();
