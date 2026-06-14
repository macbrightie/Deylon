import { OpenAIService } from './openai';
import { buildOnboardingPrompt } from '../prompts/onboarding';
import type { ConversationMessage } from '../types/ai';

export class OnboardingService {
  static async chat(messages: ConversationMessage[], context?: { name?: string, timezone?: string }): Promise<string> {
    return OpenAIService.generateChatResponse(
      messages,
      buildOnboardingPrompt(context)
    );
  }

  static isProfileComplete(lastAssistantMessage: string): boolean {
    return lastAssistantMessage.includes('[PROFILE_READY]');
  }
}
