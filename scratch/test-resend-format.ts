import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('❌ Error: RESEND_API_KEY is not defined in .env.local');
  process.exit(1);
}

const resend = new Resend(resendApiKey);

async function testFrom(fromValue: string) {
  console.log(`\nTesting From Address: "${fromValue}"`);
  try {
    const sendRes = await resend.emails.send({
      from: fromValue,
      to: 'testingevil0@gmail.com',
      subject: 'Resend From Format Test',
      html: `<p>Testing from format: ${fromValue}</p>`,
    });

    if (sendRes.error) {
      console.log(`❌ Failed:`, sendRes.error);
    } else {
      console.log(`✅ Success! Message ID:`, sendRes.data?.id);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

async function run() {
  // 1. Correct format (with quotes in env)
  await testFrom('"Deylon <login@me.getdeylon.com>"');
  
  // 2. Format with double quotes inside
  await testFrom('\"Deylon\" <login@me.getdeylon.com>');

  // 3. Just email
  await testFrom('login@me.getdeylon.com');

  // 4. Missing brackets
  await testFrom('Deylon login@me.getdeylon.com');
  
  // 5. Empty/undefined
  await testFrom('');
}

run().catch(console.error);
