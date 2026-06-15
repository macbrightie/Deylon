// Node 20 native fetch
async function run() {
  const homepageRes = await fetch('https://getdeylon.com/');
  const html = await homepageRes.text();
  
  // Find all JS chunks in the html
  const jsRegex = /\/_next\/static\/chunks\/[a-zA-Z0-9-._]+\.js/g;
  const matches = html.match(jsRegex) || [];
  console.log('Found JS chunks:', matches);
  
  for (const chunkPath of matches) {
    const chunkUrl = 'https://getdeylon.com' + chunkPath;
    console.log('Fetching', chunkUrl);
    const chunkRes = await fetch(chunkUrl);
    const code = await chunkRes.text();
    
    // Search for supabase URL pattern: https://xxxx.supabase.co
    const supabaseUrlRegex = /https:\/\/[a-z]{20}\.supabase\.co/g;
    const foundUrls = code.match(supabaseUrlRegex);
    if (foundUrls) {
      console.log('✅ FOUND SUPABASE URL:', foundUrls);
    }
  }
}
run().catch(console.error);
