export type Intensity = 'steady' | 'serious' | 'all-in';

export type SprintStatus = 'done' | 'grace' | 'missed' | 'pending';

export type CardStatus = 'pending' | 'done' | 'adjusted' | 'partial';

export interface Milestone {
  period: string;
  title: string;
  description: string;
  key_focus: string;
  small_win: string;
}

export interface SprintStructure {
  week_1_theme: string;
  week_2_theme: string;
  week_3_theme: string;
}

export interface DailyTask {
  day_number: number;
  task: string;
  duration: string;
  chain_to_sprint: string;
  chain_to_goal: string;
  why_this_works?: string;
  social_chat_messages?: string[];
}

export interface WeeklyRoutine {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Habit {
  habit: string;
  duration: string;
  best_time: string;
  purpose: string;
  tiny_version: string;
}

export interface RiskAndFix {
  risk: string;
  fix: string;
  early_warning_sign: string;
}

export interface PlanData {
  motivational_anchor: string;
  summary: string;
  sprint_theme: string;
  primary_goal: string;
  primary_goal_type: string;
  supporting_goals: string[];
  timeline_years: number;
  timeline_months: number;
  intensity: Intensity;
  milestones: Milestone[];
  sprint_structure: SprintStructure;
  daily_tasks: DailyTask[];
  weekly_routine: WeeklyRoutine;
  habits: Habit[];
  biggest_risk_and_fix: RiskAndFix;
  identity_statement: string;
  first_move_tonight: string;
  upgrade_nudge_day: number;
  context_notes?: string;
  version?: number;
  created_at?: string;
}

