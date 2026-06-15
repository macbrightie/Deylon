// Native fetch
async function run() {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8674453471:AAFI58gVI21G82cJopsJRMjRCc4oUtAiI_Y';
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json();
  console.log(data);
}
run().catch(console.error);
