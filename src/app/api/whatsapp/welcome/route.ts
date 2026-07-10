import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPlatformMessage } from '@/lib/messaging';
import { appendToConversationHistory } from '@/lib/telegram/message';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // 1. Fetch user to verify they have WhatsApp and preferred platform is set to whatsapp
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, whatsapp_number, telegram_chat_id, preferred_platform, display_name, preferred_greeting')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.whatsapp_number) {
      return NextResponse.json({ error: 'User has no WhatsApp connected' }, { status: 400 });
    }

    // 2. Fetch the active conversation to get context
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let aiGreeting = '';
    const name = user.preferred_greeting || user.display_name || 'there';

    if (conversation && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      // Get the last few messages for context
      const recentContext = conversation.messages.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n');
      
      const prompt = `You are Deylon, an AI life coach. The user just connected their WhatsApp to your service. 
They were previously chatting with you on Telegram or the web dashboard.
Here is the recent context of your conversation with them:
${recentContext}

Write a short, friendly message (1-2 sentences) acknowledging that you're now connected on WhatsApp.
Also, seamlessly bridge the gap by briefly mentioning what you were just discussing in the context, and ask if they are ready to continue.
Do not use placeholders. Use their name: ${name}.
Example: "Hey Mac! I see we moved over to WhatsApp. On Telegram, we were just talking about your focus on productivity—should we pick up right where we left off?"`;

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      });

      aiGreeting = aiResponse.choices[0]?.message?.content || `Hey ${name}! I see we moved over to WhatsApp. Should we pick up right where we left off?`;
    } else {
      // No active conversation context
      aiGreeting = `Hey ${name}! I see we moved over to WhatsApp. I'm ready whenever you are!`;
    }

    // 3. Send the message
    await sendPlatformMessage(user, aiGreeting);
    
    // 4. Append the message to conversation history
    await appendToConversationHistory(supabase, user.id, 'assistant', aiGreeting);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[whatsapp-welcome] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
