import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+14155238886';

const client = twilio(accountSid, authToken);

/**
 * Sends a WhatsApp message via Twilio.
 * @param to The recipient's phone number (must include country code, e.g., +1234567890)
 * @param body The text message content
 */
export async function sendWhatsAppMessage(to: string, body: string) {
  if (!accountSid || !authToken || !fromPhone) {
    console.error('[Twilio] Missing Twilio credentials in environment variables.');
    return;
  }

  // Ensure 'whatsapp:' prefix is added
  const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const fromWhatsApp = fromPhone.startsWith('whatsapp:') ? fromPhone : `whatsapp:${fromPhone}`;

  try {
    const message = await client.messages.create({
      body: body,
      from: fromWhatsApp,
      to: toWhatsApp,
    });
    console.log(`[Twilio] Sent message to ${toWhatsApp}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`[Twilio] Error sending message to ${toWhatsApp}:`, error);
    throw error;
  }
}
