import { OpenAIService } from './openai';
import { MEMORY_EXTRACTION_SYSTEM_PROMPT, buildMemoryExtractionPrompt } from '../prompts/memory-extraction';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ExtractedMemory {
  type: 'goal' | 'fear' | 'struggle' | 'win' | 'identity' | 'schedule' | 'blocker' | 'why' | 'preference';
  content: string;
  importance: number;
}

export interface ExtractedProfileUpdates {
  streakHealth?: 'on-track' | 'at-risk' | 'falling-behind';
  motivationLevel?: 'high' | 'medium' | 'low';
  tonePreference?: 'casual' | 'warm' | 'direct' | 'reflective';
  progressNote?: string;
}

export interface ExtractionResult {
  newMemories: ExtractedMemory[];
  profileUpdates: ExtractedProfileUpdates;
  summaryUpdate: string;
}

export class MemoryService {
  /**
   * Run memory extraction on a finished conversation session.
   * Extracts new insights, saves new memories to the DB, and updates the user's running profile attributes.
   */
  static async extractAndSave(
    supabase: SupabaseClient,
    userId: string,
    conversationId: string,
    sprintDay: number
  ): Promise<ExtractionResult | null> {
    // 1. Fetch conversation messages
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    if (convError || !conv) {
      console.error('[MemoryService] Conversation not found:', convError);
      return null;
    }

    const messages = conv.messages as any[];
    if (messages.length === 0) return null;

    // Grab the last 5 messages to extract context
    const lastFive = messages.slice(-5);
    const lastFiveFormatted = lastFive
      .map((m: any) => `${m.role === 'daylon' || m.role === 'assistant' ? 'Daylon' : 'User'}: ${m.content}`)
      .join('\n');

    // 2. Fetch existing memories to present to the extraction engine as context
    const { data: existingMemories, error: memoriesError } = await supabase
      .from('user_memories')
      .select('memory_type, content, importance')
      .eq('user_id', userId);

    const existingMemoriesSummary = (existingMemories || [])
      .map((m) => `[Type: ${m.memory_type}, Importance: ${m.importance}] ${m.content}`)
      .join('\n') || 'No existing memories.';

    // 3. Build prompt and invoke structured generation with Gemini
    const prompt = buildMemoryExtractionPrompt(lastFiveFormatted, existingMemoriesSummary);

    // Schema for structured JSON generation
    const schema = {
      type: 'OBJECT',
      properties: {
        newMemories: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              type: {
                type: 'STRING',
                enum: ['goal', 'fear', 'struggle', 'win', 'identity', 'schedule', 'blocker', 'why', 'preference'],
              },
              content: { type: 'STRING' },
              importance: { type: 'INTEGER' },
            },
            required: ['type', 'content', 'importance'],
          },
        },
        profileUpdates: {
          type: 'OBJECT',
          properties: {
            streakHealth: { type: 'STRING', enum: ['on-track', 'at-risk', 'falling-behind'] },
            motivationLevel: { type: 'STRING', enum: ['high', 'medium', 'low'] },
            tonePreference: { type: 'STRING', enum: ['casual', 'warm', 'direct', 'reflective'] },
            progressNote: { type: 'STRING' },
          },
          required: ['streakHealth', 'motivationLevel', 'tonePreference', 'progressNote'],
        },
        summaryUpdate: { type: 'STRING' },
      },
      required: ['newMemories', 'profileUpdates', 'summaryUpdate'],
    };

    try {
      const extraction = await OpenAIService.generateStructuredResponse<ExtractionResult>(
        prompt,
        schema,
        MEMORY_EXTRACTION_SYSTEM_PROMPT
      );

      // 4. Save new memories to the database
      if (extraction.newMemories && extraction.newMemories.length > 0) {
        const dbMemories = extraction.newMemories.map((m) => ({
          user_id: userId,
          memory_type: m.type,
          content: m.content,
          importance: m.importance,
          sprint_day: sprintDay,
        }));

        const { error: insertError } = await supabase.from('user_memories').insert(dbMemories);
        if (insertError) {
          console.error('[MemoryService] Error inserting new memories:', insertError);
        }
      }

      // 5. Update user profile fields (profile_summary, tone_preference, motivation_level)
      const userUpdates: any = {};
      if (extraction.summaryUpdate) {
        userUpdates.profile_summary = extraction.summaryUpdate;
      }
      if (extraction.profileUpdates) {
        if (extraction.profileUpdates.tonePreference) {
          userUpdates.tone_preference = extraction.profileUpdates.tonePreference;
        }
        if (extraction.profileUpdates.motivationLevel) {
          userUpdates.motivation_level = extraction.profileUpdates.motivationLevel;
        }
      }

      if (Object.keys(userUpdates).length > 0) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', userId);

        if (userUpdateError) {
          console.error('[MemoryService] Error updating user profile details:', userUpdateError);
        }
      }

      return extraction;
    } catch (err) {
      console.error('[MemoryService] Extraction parsing or request failed:', err);
      return null;
    }
  }
}

