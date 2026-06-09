import { OpenAIService } from './openai';
import { getDayNumber, formatDate, formatTime } from '@/lib/utils/date';
import { buildDailyChatPrompt } from '../prompts/daily-chat';
import { buildChatSystemPrompt } from '../utils/context-builder';
import { retrieveMemories } from '../utils/memory-retrieval';
import { HEALTH_SCORE_SYSTEM_PROMPT, buildHealthScorePrompt } from '../prompts/health-score';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConversationMessage } from '../types/ai';

export interface HealthScoreResult {
  healthScore: number;
  status: 'on-track' | 'at-risk' | 'falling-behind' | 'disengaged';
  recommendation: 'maintain' | 'soften' | 'reengage' | 'restart-offer';
  nextCheckInTone: 'celebratory' | 'warm' | 'honest' | 'recovery';
}

export class DailyChatService {
  /**
   * Main chat driver for Deylon.
   * Pulls context, retrieves memories, prepends context injection, and sends to Gemini.
   */
  static async chat(
    supabase: SupabaseClient,
    userId: string,
    conversationId: string,
    sprintDay: number
  ): Promise<string> {
    // 1. Fetch user profile and summary info
    const { data: user } = await supabase
      .from('users')
      .select('profile_summary, tone_preference, timezone')
      .eq('id', userId)
      .single();

    // Fetch latest active plan to calculate timezone-safe sprint day
    const { data: plan } = await supabase
      .from('plans')
      .select('id, created_at, start_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const timezone = user?.timezone || 'Africa/Lagos';
    if (plan) {
      sprintDay = getDayNumber(plan.start_date || new Date(plan.created_at), timezone);
    }

    // 2. Fetch conversation details & extracted profile (name)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    const messages = (conversation.messages || []) as ConversationMessage[];
    const extractedProfile = conversation.extracted_profile || {};
    const name = extractedProfile.name || 'Friend';
    const profileSummary = user?.profile_summary || extractedProfile.context || 'A motivated user starting their journey.';
    const tonePref = (user?.tone_preference || 'warm') as 'casual' | 'warm' | 'direct' | 'reflective';

    // 3. Fetch daily tasks (yesterday and today)
    const { data: dailyCards } = await supabase
      .from('daily_cards')
      .select('*')
      .eq('user_id', userId)
      .in('day_number', [sprintDay - 1, sprintDay]);

    const yesterdayCard = dailyCards?.find((c) => c.day_number === sprintDay - 1);
    const todayCard = dailyCards?.find((c) => c.day_number === sprintDay);

    const yesterdayMove = sprintDay === 1 ? 'None (First day of sprint)' : (yesterdayCard?.task || 'No move assigned');
    const yesterdayStatus = sprintDay === 1 ? 'none' : ((yesterdayCard?.status || 'missed') as 'done' | 'partial' | 'missed' | 'none');
    const todayMove = todayCard?.task || 'Generating your next move...';
    const todayMoveDuration = todayCard?.duration || '10m';

    // 4. Calculate stats (streak, moves completed this week)
    const { data: recentCards } = await supabase
      .from('daily_cards')
      .select('status')
      .eq('user_id', userId)
      .gte('day_number', Math.max(1, sprintDay - 7))
      .lt('day_number', sprintDay);

    const weeklyMovesCompleted = recentCards?.filter((c) => c.status === 'done' || c.status === 'partial').length || 0;

    // Current streak (consecutive 'done' or 'grace' statuses in sprint_progress)
    const { data: progressList } = await supabase
      .from('sprint_progress')
      .select('*')
      .eq('user_id', userId)
      .order('day_number', { ascending: false });

    let streakCurrent = 0;
    if (progressList) {
      for (const day of progressList) {
        if (day.status === 'done' || day.status === 'grace') {
          streakCurrent++;
        } else {
          break;
        }
      }
    }

    // 5. Fetch latest health score
    const { data: latestHealth } = await supabase
      .from('health_scores')
      .select('score')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const healthScore = latestHealth?.score || 10;

    // 6. Retrieve memories (context-matched using the last user message)
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const { core, relevant } = await retrieveMemories(supabase, userId, lastUserMessage);

    // 7. Assemble context injection and final prompt
    const currentDate = `${formatDate(new Date(), timezone)} at ${formatTime(new Date(), timezone)}`;
    const systemPromptBase = buildDailyChatPrompt(name, sprintDay);
    const chatSystemPrompt = buildChatSystemPrompt(systemPromptBase, {
      name,
      currentDate,
      sprintDay,
      streakCurrent,
      healthScore,
      tonePreference: tonePref,
      summaryUpdate: profileSummary,
      yesterdayMove,
      yesterdayStatus,
      todayMove,
      todayMoveDuration,
      weeklyMovesCompleted,
      coreMemories: core.map((c) => c.content),
      relevantMemories: relevant.map((r) => r.content),
      lastThreeMessages: messages.slice(-3).map((m) => ({
        role: m.role === 'assistant' ? 'deylon' : 'user',
        content: m.content,
      })),
    });

    // 8. Generate response from Gemini
    return OpenAIService.generateChatResponse(messages, chatSystemPrompt);
  }

  /**
   * Health score calculator.
   * Invokes Gemini Health Score engine, saves result in DB, and returns it.
   */
  static async calculateHealthScore(
    supabase: SupabaseClient,
    userId: string,
    sprintDay: number
  ): Promise<HealthScoreResult | null> {
    // 1. Fetch move completion rate last 7 days
    const { data: last7DaysCards } = await supabase
      .from('daily_cards')
      .select('status')
      .eq('user_id', userId)
      .gte('day_number', Math.max(1, sprintDay - 7))
      .lt('day_number', sprintDay);

    const completedCount = last7DaysCards?.filter((c) => c.status === 'done' || c.status === 'partial').length || 0;
    const totalCount = last7DaysCards?.length || 0;
    const moveCompletionLast7Days = `${completedCount}/${totalCount}`;

    // 2. Fetch last weekly self-report energy score (from daily_cards or sprint_progress comments)
    const lastWeeklySelfReportScore = 4; // Default or fetched from historical logs

    // 3. Days since last app open (approximate using last conversation's created_at)
    const { data: lastConv } = await supabase
      .from('conversations')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let daysSinceLastAppOpen = 0;
    if (lastConv) {
      const lastOpen = new Date(lastConv.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastOpen.getTime());
      daysSinceLastAppOpen = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // 4. Sentiment of last 3 chats
    const conversationSentimentLast3 = 'neutral';

    // 5. Streak current
    const { data: progressList } = await supabase
      .from('sprint_progress')
      .select('status')
      .eq('user_id', userId)
      .order('day_number', { ascending: false });

    let streakCurrent = 0;
    if (progressList) {
      for (const day of progressList) {
        if (day.status === 'done' || day.status === 'grace') {
          streakCurrent++;
        } else {
          break;
        }
      }
    }

    // 6. Build prompt and call structured response
    const prompt = buildHealthScorePrompt({
      moveCompletionLast7Days,
      lastWeeklySelfReportScore,
      daysSinceLastAppOpen,
      conversationSentimentLast3,
      streakCurrent,
    });

    const schema = {
      type: 'OBJECT',
      properties: {
        healthScore: { type: 'INTEGER' },
        status: { type: 'STRING', enum: ['on-track', 'at-risk', 'falling-behind', 'disengaged'] },
        recommendation: { type: 'STRING', enum: ['maintain', 'soften', 'reengage', 'restart-offer'] },
        nextCheckInTone: { type: 'STRING', enum: ['celebratory', 'warm', 'honest', 'recovery'] },
      },
      required: ['healthScore', 'status', 'recommendation', 'nextCheckInTone'],
    };

    try {
      const result = await OpenAIService.generateStructuredResponse<HealthScoreResult>(
        prompt,
        schema,
        HEALTH_SCORE_SYSTEM_PROMPT
      );

      // Save calculation to health_scores table
      const { error: dbError } = await supabase.from('health_scores').insert({
        user_id: userId,
        score: result.healthScore,
        status: result.status,
        recommendation: result.recommendation,
        tone: result.nextCheckInTone,
        sprint_day: sprintDay,
      });

      if (dbError) {
        console.error('[DailyChatService] Error inserting health score:', dbError);
      }

      return result;
    } catch (err) {
      console.error('[DailyChatService] Health score calculation failed:', err);
      return null;
    }
  }
}

