import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OnboardingService } from '@/lib/ai/services/onboarding.service';
import { DailyChatService } from '@/lib/ai/services/daily-chat.service';
import { MemoryService } from '@/lib/ai/services/memory.service';
import type { ConversationMessage } from '@/lib/ai/types/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, conversationId } = body as {
      messages: ConversationMessage[];
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured in environment
    const isSupabaseConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let user = null;
    let plan = null;
    let supabase = null;

    if (isSupabaseConfigured) {
      try {
        supabase = await createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        user = authUser;

        if (user) {
          const { data } = await supabase
            .from('plans')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          plan = data;
        }
      } catch (supabaseError) {
        console.warn('[chat/route] Supabase client initialization bypassed/failed:', supabaseError);
      }
    }

    let assistantMessage = '';
    let complete = false;

    if (plan && user && supabase) {
      // ─── DAILY COACHING CHAT FLOW (SPRINT PHASE) ───
      
      // Determine active sprint day
      const { data: latestCard } = await supabase
        .from('daily_cards')
        .select('day_number')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('day_number', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      const sprintDay = latestCard?.day_number || 1;

      // Find or create active conversation
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const { data: activeConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        activeConversationId = activeConv?.id;
      }

      if (!activeConversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, messages: [] })
          .select()
          .single();
        
        activeConversationId = newConv?.id;
      }

      if (activeConversationId) {
        // Save the incoming user message to history
        const userMsg = messages[messages.length - 1];
        if (userMsg && userMsg.role === 'user') {
          const { data: currentConv } = await supabase
            .from('conversations')
            .select('messages')
            .eq('id', activeConversationId)
            .single();
          
          const updatedMessages = [...(currentConv?.messages || []), userMsg];
          await supabase
            .from('conversations')
            .update({ messages: updatedMessages })
            .eq('id', activeConversationId);
        }

        // Call Daily Coaching chat generator
        assistantMessage = await DailyChatService.chat(supabase, user.id, activeConversationId, sprintDay);

        // Save Aven's reply to history
        const { data: currentConv } = await supabase
          .from('conversations')
          .select('messages')
          .eq('id', activeConversationId)
          .single();
        
        const finalMessages = [...(currentConv?.messages || []), { role: 'model', content: assistantMessage }];
        await supabase
          .from('conversations')
          .update({ messages: finalMessages })
          .eq('id', activeConversationId);

        // Run background analytical processes concurrently
        try {
          Promise.allSettled([
            DailyChatService.calculateHealthScore(supabase, user.id, sprintDay),
            MemoryService.extractAndSave(supabase, user.id, activeConversationId, sprintDay)
          ]);
        } catch (bgError) {
          console.error('[chat/route] Background AI tasks error:', bgError);
        }
      } else {
        throw new Error('No active conversation session available');
      }
    } else {
      // ─── ONBOARDING CHAT FLOW (NO PLAN OR UNCONFIGURED SUPABASE) ───
      assistantMessage = await OnboardingService.chat(messages);
      complete = OnboardingService.isProfileComplete(assistantMessage);

      // Persist conversation if we have a user session and supabase client
      if (user && conversationId && supabase) {
        const updatedMessages: ConversationMessage[] = [
          ...messages,
          { role: 'assistant', content: assistantMessage },
        ];

        await supabase
          .from('conversations')
          .upsert({
            id: conversationId,
            user_id: user.id,
            messages: updatedMessages,
            completed: complete,
          })
          .eq('id', conversationId);
      }
    }

    let cleanMessage = assistantMessage;
    if (complete) {
      cleanMessage = assistantMessage.replace(/\[PROFILE_READY\][\s\S]*?\[\/PROFILE_READY\]/g, '').trim();
    }

    return NextResponse.json({
      message: cleanMessage,
      complete,
    });
  } catch (error) {
    console.error('[chat/route] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

