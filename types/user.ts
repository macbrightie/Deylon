import type { Intensity } from './plan';

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  telegram_chat_id: number | null;
  timezone: string;
  location: string | null;
  intensity: Intensity;
  is_pro?: boolean;
  starting_level?: string;
}

export interface ExtractedProfile {
  name?: string;
  age?: number;
  location?: string;
  timezone?: string;
  primary_goal?: string;
  timeline_years?: number;
  intensity?: Intensity;
  startingLevel?: string;
  whys?: string[];
  constraints?: string[];
  strengths?: string[];
  context?: string;
}
