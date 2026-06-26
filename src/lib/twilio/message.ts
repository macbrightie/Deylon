/**
 * Converts Telegram-style HTML tags to WhatsApp markdown format.
 * WhatsApp markdown:
 * Bold: *text*
 * Italic: _text_
 * Strikethrough: ~text~
 */
export function formatForWhatsApp(htmlText: string): string {
  if (!htmlText) return '';

  let text = htmlText;
  
  // Convert bold
  text = text.replace(/<b>(.*?)<\/b>/g, '*$1*');
  text = text.replace(/<strong>(.*?)<\/strong>/g, '*$1*');

  // Convert italic
  text = text.replace(/<i>(.*?)<\/i>/g, '_$1_');
  text = text.replace(/<em>(.*?)<\/em>/g, '_$1_');

  // Remove links or convert them to plain text URLs
  text = text.replace(/<a href="(.*?)">(.*?)<\/a>/g, '$2 ($1)');

  return text;
}
