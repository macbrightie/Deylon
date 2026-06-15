import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Deylon <login@deylon.app>';

if (!resendApiKey) {
  console.error('❌ Error: RESEND_API_KEY is not defined in .env.local');
  process.exit(1);
}

console.log('API Key:', resendApiKey.substring(0, 10) + '...');
console.log('From Email:', fromEmail);

const resend = new Resend(resendApiKey);

async function run() {
  console.log('\n--- 1. Testing Resend API Connection & Listing Domains ---');
  try {
    const domainsRes = await resend.domains.list();
    console.log('Domains list result:', JSON.stringify(domainsRes, null, 2));
  } catch (err) {
    console.error('Error fetching domains list:', err);
  }

  console.log('\n--- 2. Attempting to send a test email ---');
  try {
    const sendRes = await resend.emails.send({
      from: fromEmail,
      to: 'testingevil0@gmail.com',
      subject: 'Resend Test Email',
      html: '<p>If you see this, Resend email sending is working perfectly!</p>',
    });

    console.log('Send Email Result:', JSON.stringify(sendRes, null, 2));
  } catch (err) {
    console.error('Exception when sending email:', err);
  }
}

run().catch(console.error);
