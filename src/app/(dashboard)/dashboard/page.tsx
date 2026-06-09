'use client';
import { GodModeWidget } from '@/components/admin/GodModeWidget';
 
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { PrivacyModal } from '@/components/ui/PrivacyModal';
import { EmbeddedChat } from '@/components/landing/EmbeddedChat';

const mapDbMessagesToChat = (dbMessages: any[]): any[] => {
  return (dbMessages || []).map((m: any, idx: number) => ({
    id: `db-${idx}-${Date.now()}`,
    role: m.role === 'assistant' ? 'deylon' : 'me',
    text: m.content || '',
  }));
};
 
type ViewMode = 'Grid' | 'Swipe';
 
// ─── Lead Icon SVG (settings) ─────────────────────────────────────────────────
function LeadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_738_200)">
        <path d="M7.23946 3.33324L9.41165 1.16107C9.73707 0.835632 10.2647 0.835632 10.5902 1.16107L12.7623 3.33324H15.8342C16.2945 3.33324 16.6676 3.70634 16.6676 4.16657V7.23848L18.8397 9.41067C19.1652 9.73609 19.1652 10.2638 18.8397 10.5892L16.6676 12.7613V15.8333C16.6676 16.2935 16.2945 16.6666 15.8342 16.6666H12.7623L10.5902 18.8388C10.2647 19.1642 9.73707 19.1642 9.41165 18.8388L7.23946 16.6666H4.16755C3.70732 16.6666 3.33422 16.2935 3.33422 15.8333V12.7613L1.16205 10.5892C0.836608 10.2638 0.836608 9.73609 1.16205 9.41067L3.33422 7.23848V4.16657C3.33422 3.70634 3.70732 3.33324 4.16755 3.33324H7.23946ZM5.00088 4.99991V7.92884L2.92982 9.99992L5.00088 12.071V14.9999H7.92982L10.0009 17.071L12.072 14.9999H15.0009V12.071L17.072 9.99992L15.0009 7.92884V4.99991H12.072L10.0009 2.92884L7.92982 4.99991H5.00088ZM10.0009 13.3333C8.15993 13.3333 6.66755 11.8408 6.66755 9.99992C6.66755 8.15896 8.15993 6.66657 10.0009 6.66657C11.8418 6.66657 13.3342 8.15896 13.3342 9.99992C13.3342 11.8408 11.8418 13.3333 10.0009 13.3333ZM10.0009 11.6666C10.9214 11.6666 11.6676 10.9204 11.6676 9.99992C11.6676 9.07942 10.9214 8.33326 10.0009 8.33326C9.0804 8.33326 8.33423 9.07942 8.33423 9.99992C8.33423 10.9204 9.0804 11.6666 10.0009 11.6666Z" fill="#4E4E55"/>
      </g>
      <defs>
        <clipPath id="clip0_738_200">
          <rect width="20" height="20" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}
 
// ─── Navbar ───────────────────────────────────────────────────────────────────
interface DashboardNavProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  telegramConnected: boolean;
  onToggleTelegram: () => void;
  profilePhoto: string | null;
}
 
function DashboardNav({ 
  onOpenSettings, 
  onOpenProfile, 
  telegramConnected, 
  onToggleTelegram,
  profilePhoto
}: DashboardNavProps) {
  return (
    <nav className="w-full flex items-center justify-between px-6 md:px-8 py-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#104d3b] flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white" />
        </div>
        <span className="font-sans text-[16px] font-medium text-[#1a1a1a] tracking-tight">deylon</span>
      </Link>
      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Connect Telegram button */}
        <button
          onClick={onToggleTelegram}
          className="h-9 inline-flex items-center gap-2 pl-3 pr-4 rounded-full border border-black/10 bg-white hover:bg-black/[0.02] active:scale-[0.98] transition-all select-none text-[#1a1a1a] font-sans font-medium text-[13px] shadow-sm cursor-pointer"
        >
          {telegramConnected ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <circle cx="12" cy="12" r="12" fill="#24A1DE" />
                <path d="M5.97927 11.8831L17.2023 6.94586C17.7214 6.70251 18.1751 7.07063 18.0063 7.8224L16.0959 16.8226C15.9525 17.466 15.5714 17.6256 15.0322 17.3228L12.122 15.1787L10.7183 16.5298C10.5627 16.6853 10.4326 16.8153 10.1324 16.8153L10.3413 13.8542L15.7317 8.97405C15.966 8.76516 15.6806 8.64936 15.3676 8.85769L8.70617 13.052L5.83445 12.1554C5.20967 11.9602 5.19799 11.5306 5.96497 11.2307L5.97927 11.8831Z" fill="white" />
              </svg>
              <span>Connected</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <circle cx="12" cy="12" r="12" fill="#9CA3AF" />
                <path d="M5.97927 11.8831L17.2023 6.94586C17.7214 6.70251 18.1751 7.07063 18.0063 7.8224L16.0959 16.8226C15.9525 17.466 15.5714 17.6256 15.0322 17.3228L12.122 15.1787L10.7183 16.5298C10.5627 16.6853 10.4326 16.8153 10.1324 16.8153L10.3413 13.8542L15.7317 8.97405C15.966 8.76516 15.6806 8.64936 15.3676 8.85769L8.70617 13.052L5.83445 12.1554C5.20967 11.9602 5.19799 11.5306 5.96497 11.2307L5.97927 11.8831Z" fill="white" />
              </svg>
              <span>Connect telegram</span>
            </>
          )}
        </button>

        <button 
          onClick={onOpenSettings}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
          title="Settings"
        >
          <LeadIcon />
        </button>
        {/* Avatar with green online dot */}
        <div 
          onClick={onOpenProfile}
          className="relative cursor-pointer hover:opacity-90 active:scale-95 transition-all"
          title="Edit Profile"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border border-black/10 flex items-center justify-center bg-[#104d3b]">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src="/UI-design-and-element/BRIGHT MBA AVI 2 1.png"
                alt="Profile"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#104d3b] border-2 border-white" />
        </div>
      </div>
    </nav>
  );
}

// ─── Iconsax Chart SVG Icon ───────────────────────────────────────────────────
function IconsaxChart({ bg = '#2D766F' }: { bg?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_745_2616)">
        <rect width="21.6216" height="21.6216" fill={bg}/>
        <mask id="mask0_745_2616" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="22">
          <path d="M21.6216 0H0V21.6216H21.6216V0Z" fill="white"/>
        </mask>
        <g mask="url(#mask0_745_2616)">
          <path d="M3.62255 5.37833C2.47841 6.89185 1.80273 8.77473 1.80273 10.8108C1.80273 15.7837 5.83877 19.8198 10.8117 19.8198C15.7847 19.8198 19.8208 15.7837 19.8208 10.8108C19.8208 5.83779 15.7847 1.80176 10.8117 1.80176" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4.50586 10.8112C4.50586 14.2977 7.32568 17.1175 10.8122 17.1175C14.2987 17.1175 17.1185 14.2977 17.1185 10.8112C17.1185 7.3247 14.2987 4.50488 10.8122 4.50488" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.8125 14.4142C12.8035 14.4142 14.4161 12.8016 14.4161 10.8106C14.4161 8.81964 12.8035 7.20703 10.8125 7.20703" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </g>
      <defs>
        <clipPath id="clip0_745_2616">
          <rect width="21.6216" height="21.6216" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

// ─── Translations Dictionary & Helper ──────────────────────────────────────────
const TRANSLATIONS: Record<string, Record<string, string>> = {
  English: {
    hey: 'Hey',
    moves_checked: 'Moves Checked',
    specific_habits: 'Specific Habits',
    habit_grid_title: 'Your habit activity',
    overall_progress_desc: 'See and track how much work you have put in. Blue squares show days where you completed all daily moves.',
    specific_habits_desc: 'Track your consistency on core habits. Green squares represent active practice days scheduled for your core habits.',
    here_are_move_cards: 'Here are your move cards',
    update_goals: 'Update Goals',
    adjust_overall_plan: 'Adjust overall plan',
    rest_practice_pending: 'Rest / Practice Pending',
    daily_move_completed: 'Daily Move Completed',
    core_habit_scheduled: 'Core Habit Scheduled',
    core_habits_checklist: 'Core Habits Checklist:',
    goals_pending: 'Goals\nPending',
    longest_streak: 'Longest\nstreak',
    dream_duration: 'Dream\nduration',
    upgrade_pro: 'Upgrade to Pro',
    upgrade_plan: 'Upgrade plan',
    general_settings: 'General Settings',
    connect_telegram: 'Connect Telegram',
    connect_whatsapp: 'Connect WhatsApp',
    language: 'Language',
    connected: 'Connected',
    your_progress: 'your progress',
    amazing_work: 'Amazing work!\nYou nailed it.',
    keep_pushing: 'Keep pushing\nyour limits!',
    back: 'Back',
  },
  French: {
    hey: 'Salut',
    moves_checked: 'Mouvements Validés',
    specific_habits: 'Habitudes Spécifiques',
    habit_grid_title: "Votre activité d'habitudes",
    overall_progress_desc: 'Visualisez et suivez le travail accompli. Les carrés bleus indiquent les jours où vous avez complété toutes les actions.',
    specific_habits_desc: 'Suivez votre régularité sur les habitudes clés. Les carrés verts représentent les jours de pratique active prévus.',
    here_are_move_cards: "Voici vos cartes d'actions",
    update_goals: 'Mettre à jour les objectifs',
    adjust_overall_plan: 'Ajuster le plan global',
    rest_practice_pending: 'Repos / Pratique en attente',
    daily_move_completed: 'Action quotidienne validée',
    core_habit_scheduled: 'Habitude planifiée',
    core_habits_checklist: 'Liste des Habitudes :',
    goals_pending: 'Objectifs\nen attente',
    longest_streak: 'Série la plus\nlongue',
    dream_duration: 'Durée du\nrêve',
    upgrade_pro: 'Passer à Pro',
    upgrade_plan: 'Mettre à niveau le plan',
    general_settings: 'Paramètres Généraux',
    connect_telegram: 'Connecter Telegram',
    connect_whatsapp: 'Connecter WhatsApp',
    language: 'Langue',
    connected: 'Connecté',
    your_progress: 'votre progression',
    amazing_work: 'Excellent travail !\nVous avez réussi.',
    keep_pushing: 'Repoussez\nvos limites !',
    back: 'Retour',
  }
};

const t = (key: string, lang: string) => {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.English;
  return dict[key] || key;
};

// ─── Flash Card ───────────────────────────────────────────────────────────────
interface FlashCardProps {
  cardId?: string;
  dayNumber?: number;
  taskText: string;
  status: 'pending' | 'done' | 'adjusted' | 'partial';
  isDate?: boolean;
  label?: string;
  onStatusChange?: (cardId: string, status: 'pending' | 'done' | 'adjusted' | 'partial') => Promise<void>;
  langKey?: string;
}


function FlashCard({ 
  cardId, 
  dayNumber, 
  taskText, 
  status, 
  isDate = false, 
  label, 
  onStatusChange,
  langKey = 'English'
}: FlashCardProps) {
  const [activeFace, setActiveFace] = useState<'front' | 'black' | 'analytics'>('front');
  const today = new Date();
  const formatted = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;

  // Split taskText by sentences to dynamically generate the checklist
  const sentences = taskText
    ? taskText
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 2)
    : [];

  const [checkedStates, setCheckedStates] = useState<boolean[]>([]);

  useEffect(() => {
    if (status === 'done') {
      setCheckedStates(new Array(sentences.length).fill(true));
    } else {
      setCheckedStates((prev) => {
        if (prev.length !== sentences.length) {
          return new Array(sentences.length).fill(false);
        }
        if (prev.every(Boolean)) {
          return new Array(sentences.length).fill(false);
        }
        return prev;
      });
    }
  }, [status, taskText, sentences.length]);

  const toggleTask = async (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStates = [...checkedStates];
    newStates[idx] = !newStates[idx];
    setCheckedStates(newStates);

    const allChecked = newStates.every(Boolean);
    const newStatus = allChecked ? 'done' : 'pending';

    if (cardId && onStatusChange) {
      await onStatusChange(cardId, newStatus);
    }
  };

  const handleDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFace('black');
  };

  const resetCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFace('front');
  };

  const completionPercentage = sentences.length 
    ? Math.round((checkedStates.filter(Boolean).length / sentences.length) * 100) 
    : 0;

  return (
    <div className="w-full max-w-[280px] flex-shrink-0 rounded-[16px] bg-[#f0ede6] relative overflow-hidden h-[430px] transition-all duration-500 shadow-sm border border-black/5 flex flex-col justify-between">
      
      {/* Front Face Content: 24px (p-6) padding all around */}
      <div className={`absolute inset-0 p-6 flex flex-col justify-between transition-opacity duration-300 z-10 ${activeFace !== 'front' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex-1" />
        <div className="flex items-end justify-between gap-2">
          <p className="text-[#1a1a1a] text-[16px] font-medium leading-[1.4] max-w-[170px] font-sans text-left">
            {isDate ? formatted : label}
          </p>
          {/* Black Dot: 24x24px */}
          <button
            onClick={handleDotClick}
            className="w-6 h-6 rounded-full bg-[#1a1a1a] flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-300 relative z-20 flex items-center justify-center"
            aria-label="Reveal plan"
          />
        </div>
      </div>

      {/* Ink Exploding Black Overlay Circle */}
      <div
        className="absolute w-6 h-6 rounded-full bg-[#1a1a1a] bottom-6 right-6 pointer-events-none transition-transform duration-[850ms] z-20"
        style={{
          transform: activeFace !== 'front' ? 'scale(38)' : 'scale(1)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Flip 1: Black Card Face with b-bg.svg */}
      <div
        className={`absolute inset-0 bg-[#1a1a1a] z-30 transition-all duration-700 ${
          activeFace === 'black' ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'
        }`}
        style={{
          backgroundImage: activeFace === 'black' ? 'url(/UI-design-and-element/b-bg.svg)' : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full h-full p-6 flex flex-col justify-between relative text-white">
          {/* Absolute locked Top-Left Button: top-6 left-6 (24px) with bg-[#222225] */}
          <button
            onClick={(e) => { e.stopPropagation(); setActiveFace('analytics'); }}
            className="absolute top-6 left-6 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#222225] hover:scale-105 active:scale-95 transition-all shadow-sm z-40"
            title="See Analytics"
          >
            <IconsaxChart bg="#222225" />
          </button>

          {/* Checklist Area (from flash cards.png): mt-12 ensures clean space below absolute button */}
          <div className="flex-1 flex flex-col justify-center gap-3 mt-12">
            {sentences.length > 0 ? (
              sentences.map((sentence, idx) => {
                const isLast = idx === sentences.length - 1;
                const isChecked = checkedStates[idx] || false;
                return (
                  <div
                    key={idx}
                    onClick={(e) => toggleTask(idx, e)}
                    className={`flex gap-2.5 items-start cursor-pointer hover:bg-white/5 p-1 rounded transition-colors duration-200 ${
                      !isLast ? 'border-b border-white/5 pb-2.5' : ''
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all select-none">
                      {isChecked ? (
                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-white/35 hover:border-white/70 transition-colors" />
                      )}
                    </div>
                    <p className={`text-[13.5px] font-sans leading-[1.35] select-none transition-all duration-300 text-left ${
                      isChecked ? 'text-white/40 line-through' : 'text-white opacity-90'
                    }`}>
                      {sentence}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-[12px] font-sans text-white/50 text-center">
                No active moves assigned. Relax and review your plan.
              </p>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveFace('front');
              }}
              className="w-full py-2.5 rounded-[12px] bg-white/10 hover:bg-white/15 text-white text-[13px] font-sans font-medium transition-colors cursor-pointer text-center outline-none"
            >
              {t('back', langKey)}
            </button>
          </div>
        </div>
      </div>

      {/* Flip 2: Analytics Card Face with g-bg.svg */}
      <div
        className={`absolute inset-0 bg-[#163b36] z-30 transition-all duration-700 ${
          activeFace === 'analytics' ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'
        }`}
        style={{
          backgroundImage: activeFace === 'analytics' ? 'url(/UI-design-and-element/g-bg.svg)' : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full h-full p-6 flex flex-col justify-between relative text-white z-10">
          {/* Absolute locked Top-Left Button: top-6 left-6 (24px) with bg-[#2D766F] */}
          <button
            onClick={(e) => { e.stopPropagation(); setActiveFace('black'); }}
            className="absolute top-6 left-6 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#2D766F] hover:scale-105 active:scale-95 transition-all shadow-sm z-40"
            title="Back to Tasks"
          >
            <IconsaxChart bg="#2D766F" />
          </button>

          <div className="flex-1" />

          {/* Bottom Area using two rows to prevent compression */}
          <div className="flex flex-col gap-3.5 w-full pb-2 select-none text-left">
            <div className="flex flex-col">
              <span className="text-white/45 text-[11px] font-sans tracking-widest uppercase font-semibold">
                {t('your_progress', langKey)}
              </span>
              <h4 className="text-[18px] font-sans font-bold leading-[1.2] text-white mt-1 select-none whitespace-pre-line">
                {completionPercentage === 100 
                  ? t('amazing_work', langKey) 
                  : t('keep_pushing', langKey)}
              </h4>
            </div>

            <div className="flex justify-between items-center w-full border-t border-white/10 pt-3.5">
              <span className="text-[48px] font-sans font-light leading-none text-white select-none">
                {completionPercentage}%
              </span>
              <button
                onClick={resetCard}
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all flex-shrink-0"
                title="Reset card"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Habit Activity Grid ──────────────────────────────────────────────────────
const DAYS = ['Mon','Tue','Wed','Thr','Fri','Sat','Sun'];
const MONTHS_LABELS = ['Jan','Feb','Mar'];
const COLS = 13;

const HABIT_DATA = [
  [0,0,1,0,0,1,0,0,1,0,0,0,0, 0,0,1,0,0,1,0,0,1,0,0,0,0, 0,0,1,0,0,1,0,0,1,0,0,0,0],
  [0,1,1,0,1,0,0,1,1,0,0,0,0, 0,1,1,0,1,0,0,1,1,0,0,0,0, 0,1,1,0,1,0,0,1,1,0,0,0,0],
  [1,1,1,0,1,0,1,1,1,1,0,0,0, 1,1,1,0,1,0,1,1,1,1,0,0,0, 1,1,1,0,1,0,1,1,1,1,0,0,0],
  [1,0,1,0,0,0,1,0,0,1,0,1,0, 1,0,1,0,0,0,1,0,0,1,0,1,0, 1,0,1,0,0,0,1,0,0,1,0,1,0],
  [1,0,0,0,1,1,0,0,0,0,0,0,0, 1,0,0,0,1,1,0,0,0,0,0,0,0, 1,0,0,0,1,1,0,0,0,0,0,0,0],
  [0,1,1,0,0,0,0,1,0,0,0,0,0, 0,1,1,0,0,0,0,1,0,0,0,0,0, 0,1,1,0,0,0,0,1,0,0,0,0,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,0, 0,1,0,0,0,0,0,0,0,0,0,0,0, 0,1,0,0,0,0,0,0,0,0,0,0,0],
];

function HabitGrid({ 
  dailyCards, 
  filter, 
  onFilterChange,
  habits = [],
  langKey = 'English'
}: { 
  dailyCards: any[]; 
  filter: 'overall' | 'habit'; 
  onFilterChange: (f: 'overall' | 'habit') => void;
  habits?: any[];
  langKey?: string;
}) {
  const [currentMonth, setCurrentMonth] = useState<number>(5); // default to June (5)
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState<number | null>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  useEffect(() => {
    // Dynamically align calendar month names starting from the actual current month of the year
    setCurrentMonth(new Date().getMonth());
  }, []);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Create sequential months array starting from current month (i = 0 to 11)
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    months.push(monthNames[(currentMonth + i) % 12]);
  }

  // Map each of the 12 months to column offsets (spanning 4 to 5 weeks/columns per month)
  const MONTH_POSITIONS = [
    { name: months[0], col: 0 },
    { name: months[1], col: 4 },
    { name: months[2], col: 8 },
    { name: months[3], col: 13 },
    { name: months[4], col: 17 },
    { name: months[5], col: 21 },
    { name: months[6], col: 26 },
    { name: months[7], col: 30 },
    { name: months[8], col: 34 },
    { name: months[9], col: 39 },
    { name: months[10], col: 43 },
    { name: months[11], col: 47 }
  ];

  return (
    <div className="bg-[#1a1a1a] rounded-[20px] px-6 pb-[24px] pt-[32px] flex flex-col gap-6 min-h-[520px] h-auto justify-between text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h3 className="text-white text-[32px] font-normal font-sans leading-tight">
            {t('habit_grid_title', langKey)}
          </h3>
          <p className="text-[#B3B2B3] text-[16px] font-sans mt-2 leading-relaxed max-w-[480px]">
            {filter === 'overall' 
              ? t('overall_progress_desc', langKey)
              : t('specific_habits_desc', langKey)}
          </p>
        </div>
        <div ref={dropdownRef} className="relative self-start md:self-auto flex-shrink-0 z-40 select-none">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 pl-[8px] pr-[4px] py-[4px] rounded-[6px] bg-[#1a1a1a] hover:bg-[#2A2A2E] text-white text-[12px] font-sans font-medium border border-white/10 outline-none cursor-pointer transition-colors shadow-sm select-none"
          >
            <span className="leading-none">
              {filter === 'overall' ? t('moves_checked', langKey) : t('specific_habits', langKey)}
            </span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" className={`opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-1.5 w-[160px] rounded-[8px] bg-[#1a1a1a] border border-white/10 shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  onFilterChange('overall');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] font-sans transition-colors ${
                  filter === 'overall' ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('moves_checked', langKey)}
              </button>
              <button
                onClick={() => {
                  onFilterChange('habit');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] font-sans transition-colors ${
                  filter === 'habit' ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('specific_habits', langKey)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid container spanning full width with scroll capability */}
      <div className="w-full flex-1 flex gap-3 mt-2 overflow-hidden items-start">
        {/* Day labels fixed on the left (white and 16px) aligned to the larger 32px squares */}
        <div className="flex flex-col justify-between py-[1px] select-none flex-shrink-0" style={{ height: '260px' }}>
          {DAYS.map((day) => (
            <span key={day} className="text-white text-[16px] font-sans w-10 flex-shrink-0 h-[32px] leading-[32px] font-normal">
              {day}
            </span>
          ))}
        </div>

        {/* Scrollable grid area (52 columns for a full-year proper calendar view) */}
        <div className="overflow-x-auto flex-1 pb-1" style={{ scrollbarWidth: 'none' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .overflow-x-auto::-webkit-scrollbar {
              display: none;
            }
          `}} />
          <div className="flex flex-col gap-[6px]" style={{ width: `${52 * 38}px` }}>
            {DAYS.map((day, di) => (
              <div key={day} className="flex gap-[6px]">
                {Array.from({ length: 52 }).map((_, ci) => {
                  const dayNum = ci * 7 + di + 1;
                  
                  let active = false;
                  if (filter === 'overall') {
                    active = dayNum <= 21 && dailyCards.find((c) => c.day_number === dayNum)?.status === 'done';
                  } else {
                    if (selectedHabitIndex === null) {
                      active = false;
                    } else if (selectedHabitIndex === 0) {
                      active = dayNum <= 21 && (dayNum % 7 !== 0);
                    } else if (selectedHabitIndex === 1) {
                      active = dayNum <= 21 && (dayNum % 7 === 2 || dayNum % 7 === 5);
                    } else if (selectedHabitIndex === 2) {
                      active = dayNum <= 21 && (dayNum % 7 === 1 || dayNum % 7 === 3 || dayNum % 7 === 6);
                    } else {
                      active = dayNum <= 21 && (dayNum % 2 !== 0);
                    }
                  }

                  return (
                    <div
                      key={ci}
                      className={`w-[32px] h-[32px] rounded-[6px] flex-shrink-0 transition-colors ${
                        dayNum <= 21 ? 'cursor-pointer hover:ring-1 hover:ring-white/20' : ''
                      }`}
                      title={dayNum <= 21 ? `Day ${dayNum} Move` : undefined}
                      style={{
                        background: active 
                          ? (filter === 'overall' ? '#1559EF' : '#104D3B') 
                          : (dayNum <= 21 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)')
                      }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Dynamic Calendar Month Labels row - perfectly aligned to columns and scrolling in sync */}
            <div className="flex gap-[6px] mt-2 text-white text-[16px] font-sans select-none">
              {Array.from({ length: 52 }).map((_, ci) => {
                const month = MONTH_POSITIONS.find((m) => m.col === ci);
                return (
                  <span
                    key={ci}
                    className="w-[32px] flex-shrink-0 text-left select-none text-[16px] text-white font-sans font-normal"
                    style={{ overflow: 'visible', whiteSpace: 'nowrap' }}
                  >
                    {month ? month.name : ""}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Core Habits */}
      <div className="mt-2 pt-3 border-t border-white/10 flex flex-col gap-3">
        <div className="flex items-center gap-4 text-[12px] font-sans text-white/50">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] flex-shrink-0" style={{ background: filter === 'overall' ? '#1559EF' : '#104D3B' }} />
            <span>{filter === 'overall' ? t('daily_move_completed', langKey) : t('core_habit_scheduled', langKey)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-white/15 flex-shrink-0" />
            <span>{t('rest_practice_pending', langKey)}</span>
          </div>
        </div>

        {filter === 'habit' && habits.length > 0 && (
          <div className="flex flex-col gap-2 mt-1 select-none">
            <span className="text-[12px] font-semibold text-[#B3B2B3] uppercase tracking-wider block">
              {t('core_habits_checklist', langKey)}
            </span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {habits.map((h: any, idx: number) => {
                const isChecked = selectedHabitIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedHabitIndex(isChecked ? null : idx)}
                    className="flex items-center gap-2 text-white text-[13px] font-sans hover:opacity-90 outline-none cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded-[4px] border border-white/30 flex items-center justify-center bg-white/5 transition-colors">
                      {isChecked && (
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-[#104D3B]" />
                      )}
                    </div>
                    <span className={`font-medium ${isChecked ? 'text-white' : 'text-[#B3B2B3]'}`}>
                      {h.habit}
                    </span>
                    {h.duration && <span className="text-white/40 text-[12px]">({h.duration})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Map Banner ───────────────────────────────────────────────────────────────
function MapBanner({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-[16px] overflow-hidden relative flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
      style={{ minHeight: 180 }}
    >
      <Image
        src="/UI-design-and-element/cont.webp"
        alt="Map"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative z-10 w-full h-full flex items-center justify-center px-6 text-center py-4">
        <div className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span className="text-white text-[14px] font-sans font-medium leading-snug">
            See how this 21 days maps into your next 5 years
          </span>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
            <path d="M4 10h12M10 4l6 6-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, unit, label, accent }: { value: string; unit?: string; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-[14px] px-5 py-4 md:pt-[48px] md:pb-[32px] flex flex-row md:flex-col items-center md:items-start justify-between h-auto md:h-[270px] ${accent ? 'bg-[#1559EF]' : 'bg-white border border-black/5'}`}>
      <p className={`text-[15px] md:text-[16px] font-sans leading-[1.3] md:max-w-[120px] order-1 md:order-2 ${accent ? 'text-white/95' : 'text-[#4e4e55] md:text-black font-medium md:font-normal'}`}>
        <span className="hidden md:inline whitespace-pre-line">{label}</span>
        <span className="inline md:hidden">{label.replace('\n', ' ')}</span>
      </p>
      <div className="flex items-baseline gap-1.5 order-2 md:order-1 select-none">
        <span className={`text-[32px] md:text-[80px] font-sans font-light leading-none ${accent ? 'text-white' : 'text-black font-semibold md:font-light'}`}>{value}</span>
        {unit && (
          <span className={`text-[10px] md:text-[12px] font-sans font-normal uppercase tracking-widest ${accent ? 'text-white/80' : 'text-[#8E8E93]'}`}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Update Goals Drawer (Shadcn Sheet) ───────────────────────────────────────
interface UpdateGoalsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supportingGoals: string[];
  primaryGoal: string;
  onSaveGoals: (primary: string, supporting: string[]) => Promise<void>;
}

function UpdateGoalsDrawer({ isOpen, onClose, supportingGoals, primaryGoal, onSaveGoals }: UpdateGoalsDrawerProps) {
  const [tempPrimary, setTempPrimary] = useState(primaryGoal);
  const [tempSupporting, setTempSupporting] = useState<string[]>(supportingGoals || []);
  const [newGoalText, setNewGoalText] = useState('');
  const [completedGoals, setCompletedGoals] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setTempPrimary(primaryGoal);
    setTempSupporting(supportingGoals || []);
  }, [isOpen, primaryGoal, supportingGoals]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    setTempSupporting([...tempSupporting, newGoalText.trim()]);
    setNewGoalText('');
  };

  const handleRemoveGoal = (index: number) => {
    setTempSupporting(tempSupporting.filter((_, i) => i !== index));
  };

  const toggleGoalCompleted = (goal: string) => {
    if (completedGoals.includes(goal)) {
      setCompletedGoals(completedGoals.filter(g => g !== goal));
    } else {
      setCompletedGoals([...completedGoals, goal]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  const handleSave = () => {
    onSaveGoals(tempPrimary, tempSupporting);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col p-0">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-50">
            <div className="text-[40px] animate-ping">🎉✨💥</div>
          </div>
        )}

        <SheetHeader className="p-8 pb-4">
          <SheetTitle>Your Goals</SheetTitle>
          <SheetDescription>Edit your primary goal and manage your supporting checklist.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-y-auto px-8 gap-6 py-4">
          {/* Primary Goal */}
          <div className="flex flex-col text-left">
            <Label className="mb-2">Primary Goal</Label>
            <input
              type="text"
              value={tempPrimary}
              onChange={(e) => setTempPrimary(e.target.value)}
              className="w-full px-4 py-3 rounded-[12px] bg-[#ECE8E2] border border-transparent focus:border-black/10 focus:bg-[#FBFAFA] text-[#1a1a1a] text-[14px] font-sans outline-none transition-all shadow-inner"
            />
          </div>

          {/* Supporting Goals */}
          <div className="flex flex-col text-left flex-1">
            <Label className="mb-3">Supporting Goals Checklist</Label>
            <div className="overflow-y-auto space-y-2.5 pr-1" style={{ maxHeight: '260px' }}>
              {tempSupporting.map((goal, index) => {
                const isCompleted = completedGoals.includes(goal);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3.5 rounded-[12px] bg-[#ECE8E2] border border-black/5 hover:bg-[#E3DDD4] transition-colors"
                  >
                    <div
                      onClick={() => toggleGoalCompleted(goal)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border border-black/20 bg-white">
                        {isCompleted && <div className="w-3 h-3 rounded-full bg-[#104d3b]" />}
                      </div>
                      <span className={`text-[13.5px] font-sans text-left transition-all duration-300 ${isCompleted ? 'text-black/45 line-through' : 'text-black'}`}>
                        {goal}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveGoal(index)}
                      className="text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 p-1 ml-2"
                      title="Delete Goal"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                );
              })}
              {tempSupporting.length === 0 && (
                <p className="text-[13px] font-sans text-black/45 text-center mt-6">
                  No supporting goals yet. Add one below!
                </p>
              )}
            </div>
          </div>

          {/* Add Goal Input */}
          <form onSubmit={handleAddGoal} className="flex gap-2.5">
            <input
              type="text"
              placeholder="Add a supporting goal..."
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-[12px] bg-[#ECE8E2] text-[#1a1a1a] text-[13.5px] font-sans border border-transparent outline-none focus:bg-white focus:border-black/10 transition-all shadow-inner placeholder-black/25"
            />
            <Button type="submit" size="default">Add</Button>
          </form>
        </div>

        <SheetFooter className="p-8 pt-4 border-t border-black/5">
          <Button variant="outline" onClick={onClose} className="flex-1 py-6">Cancel</Button>
          <Button variant="green" onClick={handleSave} className="flex-1 py-6">Save Goals</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


// ─── Adjust Plan Modal (Shadcn Dialog) ───────────────────────────────────────

interface AdjustPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIntensity: string;
  currentTimelineMonths: number;
  onAdjustPlan: (intensity: string, months: number, description: string) => Promise<void>;
}

function AdjustPlanModal({ isOpen, onClose, currentIntensity, currentTimelineMonths, onAdjustPlan }: AdjustPlanModalProps) {
  const [intensity, setIntensity] = useState(currentIntensity || 'steady');
  const [timelineMonths, setTimelineMonths] = useState(currentTimelineMonths || 12);
  const [changeDescription, setChangeDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIntensity(currentIntensity || 'steady');
    setTimelineMonths(currentTimelineMonths || 12);
  }, [isOpen, currentIntensity, currentTimelineMonths]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeDescription.trim()) {
      alert("Please tell us what has changed in your life so Deylon can adjust your plan.");
      return;
    }
    setLoading(true);
    try {
      await onAdjustPlan(intensity, timelineMonths, changeDescription);
      onClose();
    } catch (err) {
      console.error('[Adjust Plan Modal Error]:', err);
      alert("There was an error updating your plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-[520px] overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-[#F4F0EB]/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-[24px]">
            <svg className="animate-spin w-8 h-8 text-[#104d3b] mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-[14px] font-sans font-medium text-black tracking-wide">Deylon is rewriting your plan...</span>
          </div>
        )}

        <DialogHeader className="p-8 pb-4">
          <DialogTitle>Adjust Overall Plan</DialogTitle>
          <DialogDescription>Change your sprint intensity, timeline, or tell Deylon what's changed in your life.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-8 pb-2 text-left">
          {/* Sprint Intensity */}
          <div className="flex flex-col">
            <Label className="mb-2">Sprint Intensity</Label>
            <div className="grid grid-cols-3 gap-2 bg-[#ECE8E2] rounded-[10px] p-1">
              {(['steady', 'serious', 'all-in'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setIntensity(mode)}
                  className={`py-2 text-[12.5px] font-sans font-medium transition-all rounded-[7px] capitalize ${
                    intensity === mode
                      ? 'bg-[#1a1a1a] text-white shadow-sm'
                      : 'text-black/60 hover:text-black/80'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Slider — using Shadcn Slider */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <Label>Dream Timeline</Label>
              <span className="text-[13px] font-sans font-bold text-[#104d3b]">{timelineMonths} Months</span>
            </div>
            <Slider
              min={3}
              max={60}
              step={3}
              value={[timelineMonths]}
              onValueChange={(vals) => setTimelineMonths(vals[0])}
            />
            <div className="flex justify-between text-[10px] font-sans text-[#6f6f77] mt-2 select-none">
              <span>3 mos</span>
              <span>12 mos</span>
              <span>24 mos</span>
              <span>36 mos</span>
              <span>60 mos</span>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <Label className="mb-2">What changed in your life?</Label>
            <textarea
              placeholder="E.g., 'I just got a new job with a longer commute. Make the plan slightly lighter for the next two weeks.'"
              rows={4}
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-[12px] bg-[#ECE8E2] text-[#1a1a1a] text-[13.5px] font-sans border border-transparent outline-none focus:bg-white focus:border-black/10 focus:ring-1 focus:ring-black/10 transition-all shadow-inner placeholder-black/25 resize-none leading-relaxed"
            />
            <span className="text-[11px] font-sans text-[#6f6f77] mt-1.5 leading-relaxed">
              ⚠️ Deylon will preserve all completed cards and rewrite remaining tasks to fit your updated parameters.
            </span>
          </div>
        </form>

        <DialogFooter className="p-8 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 py-6">Cancel</Button>
          <Button type="submit" onClick={handleSubmit as any} className="flex-1 py-6">Update Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Roadmap Overlay (Skill Tree) ─────────────────────────────────────────────

interface RoadmapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
  dailyCards: any[];
}

function RoadmapOverlay({ isOpen, onClose, plan, dailyCards }: RoadmapOverlayProps) {
  const [hoverNode, setHoverNode] = useState<number | null>(null);
  const [lockedPhase, setLockedPhase] = useState<any | null>(null);

  if (!isOpen) return null;

  const milestones = plan?.plan_data?.milestones || [];
  
  const phases = [
    {
      id: 1,
      title: "Current Sprint",
      period: "0 - 21 Days",
      key_focus: plan?.plan_data?.sprint_theme || "Foundation Build",
      description: plan?.plan_data?.summary || "Establishing base routines and launching initial elements.",
      small_win: "Complete 21 moves checklists successfully."
    },
    {
      id: 2,
      title: milestones[1]?.title || "Building Block",
      period: milestones[1]?.period || "1 - 3 Months",
      key_focus: milestones[1]?.key_focus || "Consistent Routine Scaling",
      description: milestones[1]?.description || "Solidifying the daily habits formed and expanding skills.",
      small_win: milestones[1]?.small_win || "Complete your first monthly milestone win."
    },
    {
      id: 3,
      title: milestones[2]?.title || "Momentum Period",
      period: milestones[2]?.period || "6 - 12 Months",
      key_focus: milestones[2]?.key_focus || "Product-Market Fit & Scale",
      description: milestones[2]?.description || "Widening reach and implementing standard growth systems.",
      small_win: milestones[2]?.small_win || "Reaching mid-stage audience size or sales goal."
    },
    {
      id: 4,
      title: milestones[3]?.title || "Dream Realisation",
      period: milestones[3]?.period || "13 - 36+ Months",
      key_focus: milestones[3]?.key_focus || "Full Independence",
      description: milestones[3]?.description || "Your vision node fully realized as a daily standard.",
      small_win: milestones[3]?.small_win || "Complete life transitions to your ultimate goal."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#131316]/95 backdrop-blur-md text-white flex justify-center items-start md:items-center p-4">
      <div className="absolute top-6 left-6 md:left-8 right-6 md:right-8 flex justify-between items-center z-10 select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#104d3b] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="font-sans text-[15px] font-medium tracking-tight text-white/90">deylon roadmap</span>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
          title="Back to Dashboard"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="w-full max-w-4xl px-4 flex flex-col justify-center items-center h-full mt-12 relative overflow-visible">
        <h2 className="text-[28px] md:text-[36px] font-serif font-light text-center mb-2 tracking-tight">
          Interactive Skill Tree
        </h2>
        <p className="text-[13px] md:text-[14px] font-sans text-white/60 text-center max-w-md mb-12 leading-relaxed">
          Hover or click on the milestone nodes to inspect how your current sprint shapes your multi-month roadmap.
        </p>

        <div className="relative flex flex-col md:flex-row items-center justify-between w-full max-w-[800px] gap-8 md:gap-4 py-8">
          <div className="absolute top-[50%] left-0 right-0 h-0.5 bg-white/10 hidden md:block z-0" />
          <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-white/10 block md:hidden z-0" />

          {phases.map((phase) => {
            const isHovered = hoverNode === phase.id;
            return (
              <div 
                key={phase.id}
                className="relative z-10 flex flex-col items-center select-none cursor-pointer"
                onMouseEnter={() => setHoverNode(phase.id)}
                onMouseLeave={() => setHoverNode(null)}
                onClick={() => {
                  if (phase.id > 1) {
                    setLockedPhase(phase);
                  } else {
                    setHoverNode(phase.id);
                  }
                }}
              >
                <div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                    isHovered 
                      ? 'border-[#1559EF] bg-[#1559EF] shadow-[0_0_20px_rgba(21,89,239,0.5)] scale-110' 
                      : 'border-white/20 bg-[#1e1e24] hover:border-white/60'
                  }`}
                >
                  <span className="text-[14px] font-sans font-bold text-white">{phase.id}</span>
                  {phase.id > 1 && (
                    <div className="absolute -top-1 -right-1 bg-[#1559EF] text-white rounded-full p-1 border border-[#131316] w-5 h-5 flex items-center justify-center" title="Locked (Premium Feature)">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  )}
                </div>

                <h4 className="text-[13px] font-sans font-bold text-white mt-3 tracking-wide">{phase.title}</h4>
                <span className="text-[10px] font-sans text-white/45 uppercase tracking-widest mt-0.5">{phase.period}</span>

                <div 
                  className={`absolute bottom-[75px] md:bottom-[85px] w-[260px] md:w-[280px] p-5 rounded-[16px] bg-[#1E1E22] border border-white/10 shadow-2xl text-left transition-all duration-300 pointer-events-none flex flex-col gap-2.5 z-50 ${
                    isHovered 
                      ? 'opacity-100 translate-y-0 scale-100 visible' 
                      : 'opacity-0 translate-y-2 scale-95 invisible'
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-sans text-[#1559EF] uppercase tracking-widest font-bold">
                      Phase {phase.id} {phase.id > 1 && "(Premium)"}
                    </span>
                    <h5 className="text-[15px] font-sans font-bold text-white leading-tight mt-0.5">
                      {phase.key_focus}
                    </h5>
                  </div>
                  
                  <p className="text-[11.5px] font-sans text-white/70 leading-relaxed">
                    {phase.description}
                  </p>

                  <div className="border-t border-white/5 pt-2 flex flex-col gap-1">
                    <span className="text-[9px] font-sans text-white/35 uppercase tracking-widest font-bold">
                      Small Win Goal
                    </span>
                    <p className="text-[11.5px] font-sans text-[#3CD070] font-medium leading-tight">
                      ✓ {phase.small_win}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Upgrade Modal */}
      {lockedPhase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1E1E22] border border-white/10 rounded-[24px] max-w-md w-full p-8 text-left shadow-2xl relative">
            <button 
              onClick={() => setLockedPhase(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="w-12 h-12 rounded-full bg-[#1559EF]/10 flex items-center justify-center text-[#1559EF] mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-sans font-bold mb-2">Unlock Deylon Pro</h3>
            <p className="text-[14px] text-white/70 leading-relaxed mb-6">
              Phase {lockedPhase.id} ({lockedPhase.title}) is a premium feature. Lock in your relocation success and get personalized admissions guides, visa application templates, and live software engineering portfolio feedback tailored specifically for France.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/pro"
                className="w-full py-3 bg-[#1559EF] hover:bg-[#3b7aff] text-white rounded-[12px] font-sans font-medium text-center transition-colors text-[14px]"
              >
                Upgrade now
              </Link>
              <button
                onClick={() => setLockedPhase(null)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-[12px] font-sans text-center transition-colors text-[14px]"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profile Modal ───────────────────────────────────────────────────────────
interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  onSave: (name: string, username: string, photo: string | null) => void;
  username: string;
  userId?: string;
}
 
function ProfileModal({ isOpen, onClose, displayName, onSave, username, userId }: ProfileModalProps) {
  const [tempDisplayName, setTempDisplayName] = useState(displayName);
  const [tempUsername, setTempUsername] = useState(username);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempDisplayName(displayName);
      setTempUsername(username);
      if (userId) {
        const savedPhoto = localStorage.getItem(`deylon_avatar_${userId}`);
        setProfilePhoto(savedPhoto);
      }
    }
  }, [isOpen, displayName, username, userId]);

  // Deriving initials reactively from display name input
  const initials = tempDisplayName
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'BM';

  const handleSave = () => {
    onSave(tempDisplayName, tempUsername, profilePhoto);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);
        if (userId) {
          localStorage.setItem(`deylon_avatar_${userId}`, base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('[Logout Error]:', err);
      window.location.href = '/';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[440px] p-8 flex flex-col items-center">
        <DialogHeader className="w-full p-0 pb-6 text-left">
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your personal information and avatar.</DialogDescription>
        </DialogHeader>

        {/* Avatar Area */}
        <div className="relative mb-6">
          <div 
            onClick={triggerFileInput}
            className="w-[110px] h-[110px] rounded-full bg-[#104D3B] flex items-center justify-center shadow-md select-none hover:scale-105 active:scale-95 transition-transform duration-300 overflow-hidden cursor-pointer"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[36px] font-sans font-bold text-white tracking-wider">
                {initials}
              </span>
            )}
          </div>
          <button 
            onClick={triggerFileInput}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-black/5 shadow-sm flex items-center justify-center hover:bg-[#F5F5F7] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Upload photo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Inputs */}
        <div className="w-full flex flex-col gap-4.5 mb-6">
          <div className="flex flex-col text-left">
            <Label className="mb-1.5 pl-1">Display name</Label>
            <input 
              type="text" 
              value={tempDisplayName}
              onChange={(e) => setTempDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-[12px] bg-[#ECE8E2] border border-transparent focus:border-black/10 focus:bg-[#FBFAFA] text-[#1a1a1a] text-[14px] font-sans outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-col text-left">
            <Label className="mb-1.5 pl-1">Username</Label>
            <input 
              type="text" 
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="your username"
              className="w-full px-4 py-3 rounded-[12px] bg-[#ECE8E2] border border-transparent focus:border-black/10 focus:bg-[#FBFAFA] text-[#1a1a1a] text-[14px] font-sans outline-none placeholder-[#6f6f77]/40 transition-all shadow-inner"
            />
          </div>
        </div>

        <p className="text-[12px] font-sans text-[#6f6f77] leading-relaxed mb-4 text-center px-4 select-none">
          Your profile helps us relate with you personally.
        </p>

        {/* Logout Button */}
        <Button 
          variant="destructive"
          onClick={handleLogout}
          className="w-full mb-8 py-3 h-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </Button>

        {/* Action Buttons */}
        <div className="w-full flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 py-3 h-auto"
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleSave}
            className="flex-1 py-3 h-auto"
          >
            Save profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Settings Modal ──────────────────────────────────────────────────────────
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'general' | 'privacy';
  telegramConnected: boolean;
  onToggleTelegram: () => void;
  onDisconnectTelegram: () => void;
  whatsappConnected: boolean;
  onToggleWhatsApp: () => void;
  activeLanguage: string;
  onChangeLanguage: (lang: string) => void;
  onExportData: () => Promise<void>;
  onResetAccount: () => Promise<void>;
}

function SettingsModal({
  isOpen,
  onClose,
  defaultTab = 'general',
  telegramConnected,
  onToggleTelegram,
  onDisconnectTelegram,
  whatsappConnected,
  onToggleWhatsApp,
  activeLanguage,
  onChangeLanguage,
  onExportData,
  onResetAccount
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general'>('general');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
    }
  }, [isOpen]);

  const langKey = activeLanguage === 'French' ? 'French' : 'English';
  const t = (key: string, lang: string) => {
    const dict: Record<string, Record<string, string>> = {
      general_settings: { English: 'General Settings', French: 'Paramètres Généraux' },
      connect_telegram: { English: 'Connect Telegram', French: 'Connecter Telegram' },
      connect_whatsapp: { English: 'Connect WhatsApp', French: 'Connecter WhatsApp' },
      connected: { English: 'Connected', French: 'Connecté' },
      language: { English: 'Language', French: 'Langue' }
    };
    return dict[key]?.[lang] || key;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-[760px] w-[92vw] md:w-full h-[85vh] md:h-[520px] overflow-hidden flex flex-row rounded-[24px]">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex flex-row w-full h-full">
          {/* Left Sidebar Pane - Hidden on Mobile */}
          <div className="hidden md:flex w-[192px] bg-[#ECE8E2] pt-20 pb-6 pl-6 pr-4 flex-col justify-between border-r border-black/5">
            <TabsList className="bg-transparent border-0 p-0 flex flex-col gap-1 items-start">
              <TabsTrigger value="general" className="w-full justify-start text-[14px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                General
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Right Content Pane */}
          <div className="flex-1 pt-16 md:pt-8 pb-6 px-6 md:px-8 flex flex-col overflow-y-auto w-full h-full">
            <TabsContent value="general" className="flex flex-col h-full m-0 outline-none w-full">
              <h4 className="font-sans font-medium text-[20px] text-[#1a1a1a] tracking-tight select-none mb-4 text-left">
                {t('general_settings', langKey)}
              </h4>

              {/* Telegram Bar */}
              <div 
                onClick={telegramConnected ? undefined : onToggleTelegram}
                className={`mt-2 flex items-center justify-between bg-[#1E1E22] text-white pt-4 pb-4 px-4 rounded-[16px] shadow-sm select-none ${
                  telegramConnected ? '' : 'hover:bg-[#2A2A2E] cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 shadow-sm">
                    <path d="M12 1C9.08328 1 6.28344 2.15964 4.22266 4.2218C2.15975 6.28477 1.00057 9.08256 1 12C1 14.9162 2.16016 17.716 4.22266 19.7782C6.28344 21.8404 9.08328 23 12 23C14.9167 23 17.7166 21.8404 19.7773 19.7782C21.8398 17.716 23 14.9162 23 12C23 9.0838 21.8398 6.28395 19.7773 4.2218C17.7166 2.15964 14.9167 1 12 1Z" fill="url(#paint0_linear_735_1460)"/>
                    <path d="M5.97927 11.8831C9.18646 10.4861 11.3246 9.56498 12.3936 9.11999C15.4496 7.84932 16.0838 7.62864 16.498 7.62116C16.5891 7.6197 16.7919 7.64221 16.9243 7.74921C17.0343 7.83944 17.0652 7.96147 17.0807 8.04715C17.0944 8.13274 17.1133 8.32782 17.0979 8.4801C16.9329 10.2195 16.2161 14.4404 15.8518 16.3886C15.6988 17.2129 15.3946 17.4893 15.1007 17.5163C14.4613 17.575 13.9766 17.0941 13.3579 16.6887C12.3902 16.0539 11.8436 15.659 10.9035 15.0397C9.81724 14.324 10.5219 13.9306 11.1407 13.2878C11.3022 13.1195 14.1176 10.5594 14.1708 10.3272C14.1777 10.2982 14.1846 10.1899 14.1193 10.1329C14.0557 10.0756 13.9611 10.0952 13.8924 10.1107C13.7944 10.1327 12.2493 11.155 9.25177 13.1774C8.81349 13.4789 8.41646 13.6259 8.05896 13.6181C7.66708 13.6097 6.91083 13.3961 6.3488 13.2135C5.6613 12.9896 5.11302 12.8712 5.16115 12.4908C5.18521 12.2928 5.45849 12.0902 5.97927 11.8831Z" fill="white"/>
                    <defs>
                      <linearGradient id="paint0_linear_735_1460" x1="1101" y1="1" x2="1101" y2="2201" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#2AABEE"/>
                        <stop offset="1" stop-color="#229ED9"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="font-sans font-medium text-[14px]">
                    {t('connect_telegram', langKey)}
                  </span>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {telegramConnected ? (
                    <>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-sans font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3CD070] shadow-glow" />
                        {t('connected', langKey)}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2.5 rounded-[8px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border-none shadow-none text-[11px] font-sans font-medium cursor-pointer"
                        onClick={onDisconnectTelegram}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* WhatsApp Bar with Premium Upgrade Crown/Star Icon */}
              <div 
                onClick={onToggleWhatsApp}
                className="mt-3 flex items-center justify-between bg-[#1E1E22] hover:bg-[#2A2A2E] text-white pt-4 pb-4 px-4 rounded-[16px] cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm select-none"
              >
                <div className="flex items-center gap-3.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 shadow-sm">
                    <path d="M12.002 2C17.5248 2 22.002 6.47715 22.002 12C22.002 17.5228 17.5248 22 12.002 22C10.1681 22 8.44948 21.5064 6.97183 20.6447L2.00613 22L3.35809 17.0315C2.49591 15.5536 2.00195 13.8345 2.00195 12C2.00195 6.47715 6.4791 2 12.002 2ZM8.39329 7.30833C8.2639 7.31742 8.13704 7.34902 8.02154 7.40811C7.93489 7.45244 7.85445 7.51651 7.72806 7.63586C7.60871 7.74855 7.53954 7.84697 7.46666 7.94186C7.09696 8.4232 6.89826 9.01405 6.90195 9.62098C6.90396 10.1116 7.0314 10.5884 7.23266 11.0336C7.64079 11.9364 8.31385 12.8908 9.20291 13.7759C9.41647 13.9885 9.6257 14.2034 9.85131 14.402C10.9548 15.3736 12.2698 16.0742 13.6917 16.4482C13.6917 16.4482 14.2517 16.5342 14.2599 16.5347C14.4454 16.5447 14.6306 16.5313 14.8163 16.5218C15.1076 16.5068 15.392 16.428 15.6494 16.2909C15.8149 16.2028 15.8932 16.159 16.0321 16.0714C16.0321 16.0714 16.0747 16.0426 16.1569 15.9814C16.2919 15.8808 16.3753 15.81 16.4876 15.6934C16.5704 15.6074 16.6416 15.5058 16.6966 15.3913C16.7748 15.2281 16.8535 14.9166 16.8848 14.6579C16.9087 14.4603 16.9015 14.3523 16.8989 14.2854C16.8946 14.1778 16.8057 14.0671 16.7083 14.0201L16.1268 13.7587C16.1268 13.7587 15.2573 13.3803 14.7255 13.1377C14.6701 13.1124 14.6095 13.1007 14.5486 13.097C14.4152 13.0888 14.2657 13.1236 14.1706 13.2238C14.1656 13.2218 14.0994 13.279 13.3759 14.1555C13.336 14.2032 13.2425 14.3069 13.0808 14.2972C13.0564 14.2955 13.0321 14.292 13.0084 14.2858C12.9429 14.2685 12.8791 14.2457 12.8167 14.2193C12.693 14.1668 12.6496 14.1669 12.5651 14.1105C11.9878 13.8583 11.458 13.5209 10.9897 13.108C10.8641 12.9974 10.7473 12.8783 10.6269 12.7616C10.2067 12.3543 9.86266 11.9211 9.60674 11.4938C9.59277 11.4705 9.57124 11.4368 9.54805 11.3991C9.50618 11.331 9.46 11.25 9.44552 11.1944C9.40835 11.0473 9.50696 10.9291 9.50696 10.9291C9.50696 10.9291 9.75036 10.663 9.86345 10.5183C9.97225 10.379 10.0662 10.2428 10.126 10.1457C10.2438 9.95633 10.2811 9.76062 10.2192 9.60963C9.93861 8.92565 9.64915 8.24536 9.35083 7.56894C9.29195 7.43545 9.11682 7.33846 8.95756 7.32007C8.90362 7.31384 8.84972 7.30758 8.79556 7.30402C8.6615 7.29748 8.52717 7.29892 8.39329 7.30833ZM6.9 12a5.1 5.1 0 1110.2 0 5.1 5.1 0 01-10.2 0z" fill="white"/>
                  </svg>
                  <span className="font-sans font-medium text-[14px]">
                    {t('connect_whatsapp', langKey)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-sans font-bold uppercase tracking-wider bg-[#1559EF] text-white rounded-full select-none shadow-sm animate-pulse">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-white flex-shrink-0">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Upgrade
                  </span>
                  {whatsappConnected && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-sans font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3CD070] shadow-glow" />
                      {t('connected', langKey)}
                    </div>
                  )}
                </div>
              </div>

              {/* Language Selection Row */}
              <div className="flex items-center justify-between mt-6 select-none text-left">
                <span className="font-sans font-medium text-[14.5px] text-[#1a1a1a]">
                  {t('language', langKey)}
                </span>
                <div className="relative">
                  <button 
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-[#ECE8E2] hover:bg-[#E3DDD4] text-[#1a1a1a] text-[13.5px] font-sans transition-all duration-200 shadow-sm"
                  >
                    <span>{activeLanguage}</span>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {langDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-[140px] bg-[#FBFAFA] border border-black/5 rounded-[12px] shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                      {['Auto-detect', 'English', 'French'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            onChangeLanguage(lang);
                            setLangDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-[13px] font-sans hover:bg-black/[0.03] transition-colors"
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface TelegramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

function TelegramConnectModal({ isOpen, onClose, onConnect }: TelegramConnectModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[440px] p-8 flex flex-col items-center text-center">
        <DialogHeader className="w-full p-0 pb-4 text-center items-center">
          <div className="w-16 h-16 rounded-full bg-[#24A1DE]/10 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.2 8.75L14.7 15.8C14.6 16.3 14.3 16.4 13.9 16.2L11.6 14.5L10.5 15.6C10.4 15.7 10.3 15.8 10.1 15.8L10.25 13.6L14.25 9.98C14.42 9.83 14.21 9.75 13.99 9.9L9.04 13.01L6.9 12.34C6.43 12.2 6.42 11.87 7 11.64L15.35 8.42C15.74 8.27 16.08 8.51 16.2 8.75Z" fill="#24A1DE" />
            </svg>
          </div>
          <DialogTitle className="text-[22px] font-sans font-semibold tracking-tight text-[#1a1a1a]">
            Connect to Telegram
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#6f6f77] font-sans leading-relaxed mt-2 max-w-sm">
            Deylon works best over Telegram. Connect your account to receive your daily challenges, timing checks, and to talk with Deylon on the go.
          </DialogDescription>
        </DialogHeader>

        <p className="text-[12px] font-sans text-[#8e8e93] leading-relaxed mb-6 max-w-xs">
          This links your chat session and starts your personalized daily notifications.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <Button 
            variant="default" 
            onClick={() => {
              onConnect();
              onClose();
            }}
            className="w-full py-3 h-auto bg-[#1a1a1a] hover:bg-[#333] text-white rounded-[12px] font-sans font-medium text-[14px]"
          >
            Connect Telegram
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full py-3 h-auto border border-black/10 hover:bg-black/5 text-[#1a1a1a] rounded-[12px] font-sans font-medium text-[14px]"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



export default function DashboardPage() {
  const router = useRouter();
  const [onboardingConvId, setOnboardingConvId] = useState<string | null>(null);
  const [onboardingMessages, setOnboardingMessages] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('Grid');
  const [activePage, setActivePage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(3);

  useEffect(() => {
    const updateCardsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1500) setCardsPerPage(5);
      else if (width >= 1200) setCardsPerPage(4);
      else if (width >= 900) setCardsPerPage(3);
      else if (width >= 600) setCardsPerPage(2);
      else setCardsPerPage(1);
    };
    
    updateCardsPerPage();
    window.addEventListener('resize', updateCardsPerPage);
    return () => window.removeEventListener('resize', updateCardsPerPage);
  }, []);

  // Dynamic Modals States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'general' | 'privacy'>('general');
  const [showGoalsDrawer, setShowGoalsDrawer] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTelegramPrompt, setShowTelegramPrompt] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState('Bright Mac');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Settings Panel States
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('Auto-detect');
  const [habitFilter, setHabitFilter] = useState<'overall' | 'habit'>('overall');

  // Supabase Fetch Data States
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [stats, setStats] = useState({
    goalsPending: 0,
    longestStreak: 0,
    dreamDuration: 5,
  });

  // Reactively parse first name for Welcome greeting
  const firstName = profileName.trim().split(/\s+/)[0] || 'Bright';

  useEffect(() => {
    const supabase = createClient();

    async function loadDashboardData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          window.location.href = '/';
          return;
        }
        setUser(authUser);

        const savedPhoto = localStorage.getItem(`deylon_avatar_${authUser.id}`);
        if (savedPhoto) {
          setProfilePhoto(savedPhoto);
        }

        // Load cached name/username from localStorage immediately (fast render)
        const cachedName = localStorage.getItem(`deylon_display_name_${authUser.id}`);
        const cachedUsername = localStorage.getItem(`deylon_username_${authUser.id}`);
        if (cachedName) setProfileName(cachedName);
        if (cachedUsername) setProfileUsername(cachedUsername);

        // 1. Fetch profile indicators from DB (authoritative source)
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        // 1.5. Fetch latest completed conversation to extract name from onboarding questions
        const { data: latestConv } = await supabase
          .from('conversations')
          .select('extracted_profile')
          .eq('user_id', authUser.id)
          .eq('completed', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const onboardingName = (latestConv?.extracted_profile as any)?.name || '';

        console.log('[DEBUG-load] authUser.id:', authUser.id);
        console.log('[DEBUG-load] cachedName:', cachedName);
        console.log('[DEBUG-load] cachedUsername:', cachedUsername);
        console.log('[DEBUG-load] userProfile:', userProfile);
        console.log('[DEBUG-load] onboardingName:', onboardingName);
        console.log('[DEBUG-load] authUser.user_metadata:', authUser?.user_metadata);

        const dbName = cachedName 
          || userProfile?.display_name 
          || authUser?.user_metadata?.display_name 
          || onboardingName 
          || userProfile?.email?.split('@')[0] 
          || authUser?.email?.split('@')[0] 
          || 'You';
        const dbUsername = cachedUsername || userProfile?.username || authUser?.user_metadata?.username || '';
        console.log('[DEBUG-load] resolved dbName:', dbName);
        console.log('[DEBUG-load] resolved dbUsername:', dbUsername);

        setProfileName(dbName);
        setProfileUsername(dbUsername);
        
        // Keep localStorage in sync
        localStorage.setItem(`deylon_display_name_${authUser.id}`, dbName);
        localStorage.setItem(`deylon_username_${authUser.id}`, dbUsername);

        if (userProfile) {
          setTelegramConnected(!!userProfile.telegram_chat_id);
        }

        // 2. Fetch active coach plan
        const { data: activePlan } = await supabase
          .from('plans')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activePlan) {
          setPlan(activePlan);

          // 3. Fetch active daily sprint cards
          const { data: dailyCards } = await supabase
            .from('daily_cards')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('plan_id', activePlan.id)
            .order('day_number', { ascending: true });

          if (dailyCards && dailyCards.length > 0) {
            setCards(dailyCards);

            const pendingCard = dailyCards.find((c) => c.status === 'pending');
            const dayNum = pendingCard ? pendingCard.day_number : 1;
            setActiveDay(dayNum);
            
            setActivePage(Math.min(7, Math.ceil(dayNum / 3)));
          }

          // Trigger Telegram connect prompt if not connected and not shown in this session yet
          if (userProfile && !userProfile.telegram_chat_id) {
            const hasShownPrompt = localStorage.getItem(`deylon_telegram_prompt_shown_${authUser.id}`);
            if (!hasShownPrompt) {
              setTimeout(() => {
                setShowTelegramPrompt(true);
                localStorage.setItem(`deylon_telegram_prompt_shown_${authUser.id}`, 'true');
              }, 1500);
            }
          }
        } else {
          // Fetch latest incomplete onboarding conversation
          const { data: latestConv } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('completed', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let currentConv = latestConv;

          if (!currentConv) {
            // Create a new incomplete conversation for this user
            const { data: newConv, error: newConvError } = await supabase
              .from('conversations')
              .insert({
                user_id: authUser.id,
                messages: [],
                completed: false
              })
              .select()
              .single();

            if (!newConvError && newConv) {
              currentConv = newConv;
            }
          }

          if (currentConv) {
            setOnboardingConvId(currentConv.id);
            if (currentConv.messages && currentConv.messages.length > 0) {
              setOnboardingMessages(mapDbMessagesToChat(currentConv.messages));
            }
          }
        }

        // 4. Fetch metrics
        const { data: sprintProgress } = await supabase
          .from('sprint_progress')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('status', 'done');

        const supportingGoalsLength = activePlan?.plan_data?.supporting_goals?.length || 0;

        setStats({
          longestStreak: sprintProgress ? sprintProgress.length : 0,
          goalsPending: supportingGoalsLength + 1,
          dreamDuration: activePlan?.timeline_months || (activePlan?.timeline_years ? activePlan.timeline_years * 12 : 60),
        });

      } catch (err) {
        console.error('[Dashboard Load Error]:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleSaveProfile = async (name: string, username: string, photo: string | null) => {
    console.log('[DEBUG-save] Inputs - name:', name, 'username:', username);
    setProfileName(name);
    setProfileUsername(username);
    if (photo) {
      setProfilePhoto(photo);
    }

    if (user) {
      // Always persist to localStorage first so refresh always restores the correct name
      localStorage.setItem(`deylon_display_name_${user.id}`, name);
      localStorage.setItem(`deylon_username_${user.id}`, username);
      console.log('[DEBUG-save] Saved to localStorage for user:', user.id);

      const supabase = createClient();
      try {
        // 1. Update auth metadata so it is guaranteed to persist in Supabase Auth DB
        const authRes = await supabase.auth.updateUser({
          data: {
            display_name: name,
            username: username
          }
        });
        console.log('[DEBUG-save] auth update result:', authRes);

        // 2. Also try updating users table (will fail gracefully if columns don't exist)
        const { error } = await supabase
          .from('users')
          .update({
            display_name: name,
            username: username
          })
          .eq('id', user.id);
        if (error) {
          console.error('[Save Profile DB Error]:', error);
        }
      } catch (err) {
        console.error('[Save Profile Error]:', err);
      }
    }
  };

  const handleAdjustPlan = async (intensity: string, months: number, description: string) => {
    try {
      const res = await fetch('/api/adjust-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intensity,
          timeline_months: months,
          change_description: description,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to adjust plan');
      }

      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (err) {
      console.error('[handleAdjustPlan Error]:', err);
      throw err;
    }
  };

  const handleSaveGoals = async (primary: string, supporting: string[]) => {
    if (!plan || !user) return;
    const supabase = createClient();
    try {
      const updatedPlanData = {
        ...plan.plan_data,
        primary_goal: primary,
        supporting_goals: supporting
      };

      const { error } = await supabase
        .from('plans')
        .update({
          primary_goal: primary,
          plan_data: updatedPlanData
        })
        .eq('id', plan.id);

      if (error) throw error;

      setPlan({
        ...plan,
        primary_goal: primary,
        plan_data: updatedPlanData
      });

      setStats((prev) => ({
        ...prev,
        goalsPending: supporting.length + 1
      }));
    } catch (err) {
      console.error('[Save Goals Error]:', err);
    }
  };

  const handleExportData = async () => {
    const supabase = createClient();
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userProfile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      const { data: userPlans } = await supabase.from('plans').select('*').eq('user_id', authUser.id);
      const { data: userCards } = await supabase.from('daily_cards').select('*').eq('user_id', authUser.id);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile: userProfile,
        plans: userPlans,
        daily_cards: userCards
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportPayload, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `deylon_data_export_${authUser.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('[Export Data Error]:', err);
    }
  };

  const handleResetAccount = async () => {
    if (!confirm("Are you absolutely sure you want to reset your account? This will permanently delete your plan, completed tasks, and history.")) {
      return;
    }
    const supabase = createClient();
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      await supabase.from('plans').delete().eq('user_id', authUser.id);
      await supabase.from('daily_cards').delete().eq('user_id', authUser.id);
      await supabase.from('sprint_progress').delete().eq('user_id', authUser.id);
      await supabase.from('user_memories').delete().eq('user_id', authUser.id);

      localStorage.removeItem("deylon_onboarding_transcript");
      localStorage.removeItem("deylon_onboarding_email");

      window.location.href = '/';
    } catch (err) {
      console.error('[Reset Account Error]:', err);
    }
  };

  const handleStatusChange = async (cardId: string, newStatus: 'pending' | 'done' | 'adjusted' | 'partial') => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('daily_cards')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null
        })
        .eq('id', cardId);

      if (error) throw error;

      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('[handleStatusChange Error]:', err);
    }
  };

  const handleToggleTelegram = () => {
    if (telegramConnected) {
      alert("Your Telegram account is connected to Deylon!");
      return;
    }
    if (!user) return;

    const token = btoa(user.id)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'DeylonBot';
    const botUrl = `https://t.me/${botUsername}?start=${token}`;
    window.open(botUrl, '_blank');
  };

  const handleDisconnectTelegram = async () => {
    if (!user) return;
    const confirmDisconnect = confirm("Are you sure you want to disconnect your Telegram account from Deylon?");
    if (!confirmDisconnect) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({
          telegram_chat_id: null,
          telegram_linking_state: null,
          preferred_greeting: null
        })
        .eq('id', user.id);

      if (error) throw error;

      setTelegramConnected(false);
    } catch (err) {
      console.error('[handleDisconnectTelegram Error]:', err);
      alert('Failed to disconnect Telegram. Please try again.');
    }
  };

  const getCardForDay = (dayNum: number) => {
    return cards.find((c) => c.day_number === dayNum);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans text-[#1a1a1a]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-[#104d3b]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-[14px] font-medium tracking-wide">Syncing Deylon Dashboard...</span>
        </div>
      </div>
    );
  }
  const langKey = activeLanguage === 'French' ? 'French' : 'English';

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav 
          onOpenSettings={() => { setSettingsDefaultTab('general'); setShowSettingsModal(true); }}
          onOpenProfile={() => setShowProfileModal(true)}
          telegramConnected={telegramConnected}
          onToggleTelegram={handleToggleTelegram}
          profilePhoto={profilePhoto}
        />

        <main className="flex-1 px-6 md:px-8 pb-10 flex flex-col items-center justify-center">
          <div className="max-w-[960px] w-full mx-auto mt-6 flex-1 flex flex-col justify-center">
            <div className="text-center mb-10">
              <h1 className="font-sans text-[24px] md:text-[32px] font-medium text-[#1a1a1a] tracking-tight">
                We noticed you haven't spoken with Deylon about your goals yet.
              </h1>
              <p className="font-sans text-[15px] md:text-[17px] text-[#4e4e55] mt-2">
                Please do that here to finish setting up your daily plan.
              </p>
            </div>
            
            <EmbeddedChat 
              userId={user?.id}
              conversationId={onboardingConvId || undefined}
              initialMessages={onboardingMessages}
              isDashboard={true}
              onCompleteOnboarding={(convId) => {
                router.push(`/building?conversationId=${convId}`);
              }}
            />
          </div>
        </main>

        <footer className="px-6 md:px-8 py-5 flex items-center justify-between text-[11px] font-sans text-[#1a1a1a]/30 border-t border-black/5">
          <div className="flex items-center gap-4">
            <span className="font-sans">© Deylon 2026</span>
            <span className="text-[#1a1a1a]/15">·</span>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowPrivacyModal(true);
              }}
              className="hover:text-[#1a1a1a]/55 transition-colors text-left font-sans outline-none"
            >
              Privacy.
            </button>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Instagram" className="hover:opacity-100 transition-opacity">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#1a1a1a" fillOpacity="0.65">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 3.674a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a href="#" aria-label="X" className="hover:opacity-100 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a1a1a" fillOpacity="0.65">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" aria-label="Telegram" className="hover:opacity-100 transition-opacity">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#1a1a1a" fillOpacity="0.65">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-.995-.651-.35-1.009.217-1.594.149-.155 2.732-2.506 2.782-2.72a.207.207 0 0 0-.049-.184c-.048-.047-.117-.031-.168-.019-.072.016-1.22.776-3.447 2.279-.326.224-.622.333-.887.328-.292-.006-.854-.165-1.272-.301-.513-.168-.92-.257-.884-.542.018-.15.225-.304.62-.465 2.429-1.058 4.049-1.756 4.858-2.095 2.311-.96 2.791-1.127 3.103-1.132z"/>
              </svg>
            </a>
          </div>
        </footer>

        {/* Dynamic Modals Overlays */}
        <ProfileModal 
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          displayName={profileName}
          username={profileUsername}
          userId={user?.id}
          onSave={handleSaveProfile}
        />

        <SettingsModal 
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          defaultTab={settingsDefaultTab}
          telegramConnected={telegramConnected}
          onToggleTelegram={handleToggleTelegram}
          onDisconnectTelegram={handleDisconnectTelegram}
          whatsappConnected={whatsappConnected}
          onToggleWhatsApp={() => setWhatsappConnected(!whatsappConnected)}
          activeLanguage={activeLanguage}
          onChangeLanguage={(lang) => setActiveLanguage(lang)}
          onExportData={handleExportData}
          onResetAccount={handleResetAccount}
        />

        <PrivacyModal 
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />
        <GodModeWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav 
        onOpenSettings={() => { setSettingsDefaultTab('general'); setShowSettingsModal(true); }}
        onOpenProfile={() => setShowProfileModal(true)}
        telegramConnected={telegramConnected}
        onToggleTelegram={handleToggleTelegram}
        profilePhoto={profilePhoto}
      />

      <main className="flex-1 px-6 md:px-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mt-2 mb-7">
          <div>
            <h1 className="font-sans text-[36px] md:text-[48px] leading-tight text-[#1a1a1a] tracking-[-0.03em]">
              {t('hey', langKey)} <span className="font-bold">{profileName}.</span>
            </h1>
            <p className="font-sans text-[20px] md:text-[24px] font-medium text-[#4e4e55] leading-relaxed mt-2 tracking-tight max-w-3xl">
              {plan?.plan_data?.motivational_anchor || 'Start building the dream.'}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-shrink-0">
            <Button 
              variant="outline"
              onClick={() => setShowGoalsDrawer(true)}
              className="h-auto py-2.5 px-5 rounded-[8px] border border-[#1a1a1a]/20 text-[#1a1a1a] text-[13px] font-sans font-medium hover:bg-[#1a1a1a]/5 transition-colors whitespace-nowrap"
            >
              {t('update_goals', langKey)}
            </Button>
            <Button 
              onClick={() => setShowAdjustModal(true)}
              className="h-auto py-2.5 px-5 rounded-[8px] bg-[#1a1a1a] hover:bg-[#333] text-white text-[13px] font-sans font-medium transition-colors whitespace-nowrap"
            >
              {t('adjust_overall_plan', langKey)}
            </Button>
          </div>
        </div>

        {/* Day 15+ Premium Upgrade Nudge Banner */}
        {activeDay >= 15 && (
          <div className="mb-6 rounded-[20px] bg-gradient-to-r from-[#104D3B] to-[#1a4034] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-white/10 select-none">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h4 className="text-[18px] font-sans font-bold leading-snug">Day {activeDay} of your 21-day sprint</h4>
                <p className="text-[14px] text-white/80 font-sans mt-1 leading-relaxed max-w-2xl">
                  You are approaching the end of your initial sprint! Unlock Deylon Pro to continue with the next phase of your relocation plan, including customized study guides, visa interviews prep, and professional French reviews.
                </p>
              </div>
            </div>
            <Link
              href="/pro"
              className="px-6 py-3 rounded-[8px] bg-white text-[#104D3B] text-[13px] font-sans font-semibold hover:bg-white/95 transition-all text-center whitespace-nowrap self-start md:self-auto hover:scale-[1.02] active:scale-[0.98]"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}

        <div className="bg-white rounded-[20px] border border-black/5 p-5 mb-5">
          {/* Commented out Grid/Swipe view mode selector per user request */}
          {/* 
          <div className="flex justify-center mb-5">
            <div className="flex items-center bg-[rgba(39,39,42,0.06)] rounded-[8px] p-0.5">
              {(['Grid','Swipe'] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-5 py-1.5 text-[13px] font-sans transition-colors rounded-[6px] ${
                    viewMode === m ? 'bg-white text-[#1a1a1a] font-medium shadow-sm' : 'bg-transparent text-[#6F6F77] hover:text-[#1a1a1a]/60'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          */}

          <div className="text-left px-[1.5%] mb-6 mt-1">
            <h2 className="text-[#1a1a1a] text-[28px] font-sans font-medium tracking-tight">
              {t('here_are_move_cards', langKey)}
            </h2>
          </div>

          <div className="flex flex-wrap gap-4 px-[1.5%]">
            {Array.from({ length: cardsPerPage }).map((_, i) => {
              const dayNum = (activePage - 1) * cardsPerPage + i + 1;
              if (dayNum > 21) return null; // Assuming 21-day plan
              const card = getCardForDay(dayNum);
              return (
                <FlashCard
                  key={dayNum}
                  cardId={card?.id}
                  dayNumber={dayNum}
                  taskText={card?.task ?? "Relax and reflect on your goal."}
                  status={card?.status ?? 'pending'}
                  label={`Day ${dayNum} Move`}
                  onStatusChange={handleStatusChange}
                  langKey={langKey}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-5 px-[1.5%] flex-wrap">
            {Array.from({ length: Math.ceil(21 / cardsPerPage) }).map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  onClick={() => {
                    setActivePage(n);
                  }}
                  className={`w-10 h-10 rounded-[8px] text-[13px] font-sans font-medium transition-colors ${
                    activePage === n
                      ? 'bg-[#1a1a1a] text-white'
                      : 'bg-[#FBFAFA] text-[#4F4E55] border border-black/5 hover:bg-[#f0ede6]'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <div className="mt-5 px-[1.5%]">
            <h2 className="text-[#1a1a1a] text-[24px] font-sans font-medium leading-snug">
              {plan?.plan_data?.sprint_theme ? `Sprint Theme: ${plan.plan_data.sprint_theme}` : "At the end of this 21 days you'd be able to..."}
            </h2>
            <p className="text-[#4e4e55] text-[16px] font-sans mt-1.5 max-w-4xl">
              {plan?.plan_data?.summary || "and this will help you do x and y and ultimately z in 3 to 5 years"}
            </p>
          </div>
        </div>

        {/* ── Bottom Two Columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Left column */}
          <div className="flex flex-col gap-4">
            <MapBanner onClick={() => setShowRoadmap(true)} />
            <div className="flex flex-col md:grid md:grid-cols-3 gap-3">
              <StatCard value={stats.goalsPending.toString()} label={t('goals_pending', langKey)} accent />
              <StatCard value={stats.longestStreak.toString()} unit="DAYS" label={t('longest_streak', langKey)} />
              <StatCard value={stats.dreamDuration.toString()} unit="MONTHS" label={t('dream_duration', langKey)} />
            </div>
            {/* Upgrade to Pro */}
            <div className="rounded-[20px] bg-[#1a1a1a] p-6 flex flex-col justify-between min-h-[130px]">
              <h3 className="text-white font-sans text-[28px] font-light leading-tight tracking-tight">
                {t('upgrade_pro', langKey)}
              </h3>
              <div className="mt-5">
                <Link
                  href="/pro"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-white/10 border border-white/10 text-white text-[12px] font-sans hover:bg-white/15 transition-colors"
                >
                  {t('upgrade_plan', langKey) || 'Upgrade plan'}
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10h12M10 4l6 6-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Right column — habit grid fills full height */}
          <HabitGrid 
            dailyCards={cards} 
            filter={habitFilter} 
            onFilterChange={setHabitFilter}
            habits={plan?.plan_data?.habits || []}
            langKey={langKey}
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-8 py-5 flex items-center justify-between text-[11px] font-sans text-[#1a1a1a]/30 border-t border-black/5">
        <div className="flex items-center gap-4">
          <span className="font-sans">© Deylon 2026</span>
          <span className="text-[#1a1a1a]/15">·</span>
          <button 
            onClick={(e) => {
              e.preventDefault();
              setShowPrivacyModal(true);
            }}
            className="hover:text-[#1a1a1a]/55 transition-colors text-left font-sans outline-none"
          >
            Privacy.
          </button>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" aria-label="Instagram" className="hover:opacity-100 transition-opacity">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1a1a1a" fillOpacity="0.65">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 3.674a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a href="#" aria-label="X" className="hover:opacity-100 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a1a1a" fillOpacity="0.65">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#" aria-label="Telegram" className="hover:opacity-100 transition-opacity">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1a1a1a" fillOpacity="0.65">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-.995-.651-.35-1.009.217-1.594.149-.155 2.732-2.506 2.782-2.72a.207.207 0 0 0-.049-.184c-.048-.047-.117-.031-.168-.019-.072.016-1.22.776-3.447 2.279-.326.224-.622.333-.887.328-.292-.006-.854-.165-1.272-.301-.513-.168-.92-.257-.884-.542.018-.15.225-.304.62-.465 2.429-1.058 4.049-1.756 4.858-2.095 2.311-.96 2.791-1.127 3.103-1.132z"/>
            </svg>
          </a>
        </div>
      </footer>

      {/* Dynamic Modals Overlays */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        displayName={profileName}
        username={profileUsername}
        userId={user?.id}
        onSave={handleSaveProfile}
      />

      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        defaultTab={settingsDefaultTab}
        telegramConnected={telegramConnected}
        onToggleTelegram={handleToggleTelegram}
        onDisconnectTelegram={handleDisconnectTelegram}
        whatsappConnected={whatsappConnected}
        onToggleWhatsApp={() => setWhatsappConnected(!whatsappConnected)}
        activeLanguage={activeLanguage}
        onChangeLanguage={(lang) => setActiveLanguage(lang)}
        onExportData={handleExportData}
        onResetAccount={handleResetAccount}
      />

      <UpdateGoalsDrawer 
        isOpen={showGoalsDrawer}
        onClose={() => setShowGoalsDrawer(false)}
        supportingGoals={plan?.plan_data?.supporting_goals || []}
        primaryGoal={plan?.primary_goal || ""}
        onSaveGoals={handleSaveGoals}
      />

      <AdjustPlanModal 
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        currentIntensity={plan?.plan_data?.intensity || "steady"}
        currentTimelineMonths={plan?.timeline_months || (plan?.timeline_years ? plan.timeline_years * 12 : 12)}
        onAdjustPlan={handleAdjustPlan}
      />

      <RoadmapOverlay 
        isOpen={showRoadmap}
        onClose={() => setShowRoadmap(false)}
        plan={plan}
        dailyCards={cards}
      />

      <PrivacyModal 
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
      <TelegramConnectModal 
        isOpen={showTelegramPrompt}
        onClose={() => setShowTelegramPrompt(false)}
        onConnect={handleToggleTelegram}
      />
      <GodModeWidget />
    </div>
  );
}
