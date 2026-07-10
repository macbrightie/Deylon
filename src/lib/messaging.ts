import { sendMessage as sendTelegramMessage } from '@/lib/telegram/bot';
import { sendWhatsAppMessage } from '@/lib/twilio/bot';
import { formatForWhatsApp } from '@/lib/twilio/message';

export interface UserForMessaging {
  id: string;
  telegram_chat_id?: string | null;
  whatsapp_number?: string | null;
  preferred_platform?: string | null;
}

/**
 * Sends a message to the user's preferred platform (WhatsApp or Telegram).
 * Safely falls back if their preferred platform is disconnected.
 */
export async function sendPlatformMessage(user: UserForMessaging, text: string) {
  const prefersWhatsApp = user.preferred_platform === 'whatsapp';
  
  if (prefersWhatsApp && user.whatsapp_number) {
    try {
      await sendWhatsAppMessage(user.whatsapp_number, formatForWhatsApp(text));
      return;
    } catch (err) {
      console.error(`Failed to send WhatsApp message to user ${user.id}:`, err);
      // Fallback to Telegram if they have it
      if (user.telegram_chat_id) {
        await sendTelegramMessage(user.telegram_chat_id, text);
      }
    }
  } else if (user.telegram_chat_id) {
    try {
      await sendTelegramMessage(user.telegram_chat_id, text);
    } catch (err) {
      console.error(`Failed to send Telegram message to user ${user.id}:`, err);
      // Fallback to WhatsApp
      if (user.whatsapp_number) {
        await sendWhatsAppMessage(user.whatsapp_number, formatForWhatsApp(text));
      }
    }
  } else if (user.whatsapp_number) {
    // If they prefer telegram but don't have it, fallback to WhatsApp
    await sendWhatsAppMessage(user.whatsapp_number, formatForWhatsApp(text));
  } else {
    console.warn(`User ${user.id} has no connected messaging platforms.`);
  }
}

/**
 * Sends an array of message bubbles with delays to the user's preferred platform.
 */
export async function sendPlatformSplitMessages(user: UserForMessaging, bubbles: string[]) {
  const prefersWhatsApp = user.preferred_platform === 'whatsapp';
  
  // Choose the target platform
  let useWhatsApp = prefersWhatsApp && !!user.whatsapp_number;
  let useTelegram = !prefersWhatsApp && !!user.telegram_chat_id;
  
  // Fallbacks
  if (!useWhatsApp && !useTelegram) {
    if (user.whatsapp_number) useWhatsApp = true;
    else if (user.telegram_chat_id) useTelegram = true;
    else return; // Nowhere to send
  }

  for (let i = 0; i < bubbles.length; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    if (useWhatsApp && user.whatsapp_number) {
      try {
        await sendWhatsAppMessage(user.whatsapp_number, formatForWhatsApp(bubbles[i]));
      } catch (err) {
        console.error('WhatsApp bubble error:', err);
      }
    } else if (useTelegram && user.telegram_chat_id) {
      try {
        await sendTelegramMessage(user.telegram_chat_id, bubbles[i]);
      } catch (err) {
        console.error('Telegram bubble error:', err);
      }
    }
  }
}
