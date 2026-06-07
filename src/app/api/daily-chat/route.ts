import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DailyChatService } from '@/lib/ai/services/daily-chat.service';
import { MemoryService } from '@/lib/ai/services/memory.service';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate payload
    const body = await request.json();
    const { conversationId, message } = body as { conversationId: string; message: string; sprintDay?: number };

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'conversationId and message are required' },
        { status: 400 }
      );
    }

    // 3. Fetch conversation from the database
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 4. Calculate active sprint day if not explicitly provided
    let sprintDay = body.sprintDay;
    if (!sprintDay) {
      const { data: latestCard } = await supabase
        .from('daily_cards')
        .select('day_number')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('day_number', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      sprintDay = latestCard?.day_number || 1;
    }

    // 5. Append user's new message to the conversation array
    const updatedMessages = [
      ...(conversation.messages || []),
      { role: 'user', content: message }
    ];

    // Save user message immediately to the database
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ messages: updatedMessages })
      .eq('id', conversationId);

    if (updateError) {
      console.error('[daily-chat] DB error updating messages:', updateError);
      return NextResponse.json(
        { error: 'Failed to update conversation history' },
        { status: 500 }
      );
    }

    // 6. Generate Daylon's coaching response
    const reply = await DailyChatService.chat(supabase, user.id, conversationId, sprintDay);

    if (!reply) {
      return NextResponse.json(
        { error: 'Failed to generate chat response' },
        { status: 500 }
      );
    }

    // 7. Save Daylon's response to the conversation database
    const finalMessages = [
      ...updatedMessages,
      { role: 'assistant', content: reply }
    ];

    await supabase
      .from('conversations')
      .update({ messages: finalMessages })
      .eq('id', conversationId);

    // 8. Run background processing concurrently (Health Score & Memory Extraction)
    try {
      await Promise.allSettled([
        DailyChatService.calculateHealthScore(supabase, user.id, sprintDay),
        MemoryService.extractAndSave(supabase, user.id, conversationId, sprintDay)
      ]);
    } catch (bgError) {
      console.error('[daily-chat] Error in background AI tasks:', bgError);
    }

    // 9. Return the response to the client
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[daily-chat/route] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
