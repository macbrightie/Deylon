'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BuildingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [steps, setSteps] = useState<string[]>([
    'Building your plan...',
    'Analyzing your goals...',
    'Structuring your timeline...',
    'Writing your first 21-day sprint challenge...',
    'Almost ready.',
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [apiDone, setApiDone] = useState(false);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      setApiDone(true); // No conversation ID to generate, skip API
      return;
    }

    async function triggerPlanGeneration() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: conv } = await supabase
          .from('conversations')
          .select('extracted_profile')
          .eq('id', conversationId)
          .maybeSingle();

        if (conv && conv.extracted_profile) {
          const profile = conv.extracted_profile as any;
          const name = profile.name || 'your';
          const goal = profile.primaryGoal ? `"${profile.primaryGoal}"` : 'your goal';
          const goalType = profile.primaryGoalType || 'other';
          
          const rawTimeline = profile.timelineGoal || '';
          let timelineDisplay = 'timeline';
          if (rawTimeline) {
            const cleanTimeline = rawTimeline.toLowerCase().trim();
            if (cleanTimeline.includes('year') || cleanTimeline.includes('yr')) {
              const yrs = cleanTimeline.match(/(\d+)/);
              timelineDisplay = yrs ? `${yrs[1]}-year plan` : '1-year plan';
            } else if (cleanTimeline.includes('month') || cleanTimeline.includes('mo')) {
              const mos = cleanTimeline.match(/(\d+)/);
              timelineDisplay = mos ? `${mos[1]}-month plan` : 'multi-month plan';
            } else if (cleanTimeline.includes('week') || cleanTimeline.includes('wk')) {
              const wks = cleanTimeline.match(/(\d+)/);
              timelineDisplay = wks ? `${wks[1]}-week plan` : 'multi-week plan';
            } else {
              timelineDisplay = `${rawTimeline} plan`;
            }
          } else {
            timelineDisplay = '1-year plan';
          }

          const welcome = `Building plan for ${name}...`;
          
          let dynamicSteps = [
            welcome,
            `Mapping your baseline strategy for ${goal}...`,
            `Breaking ${timelineDisplay} into manageable phases...`,
            'Writing your first 21-day sprint challenge...',
            'Almost ready.'
          ];

          if (goalType === 'business') {
            dynamicSteps = [
              welcome,
              `Mapping your customer discovery strategy for ${goal}...`,
              `Breaking ${timelineDisplay} into monthly sprints...`,
              'Writing your first 21-day business action cards...',
              'Almost ready.'
            ];
          } else if (goalType === 'health') {
            dynamicSteps = [
              welcome,
              `Mapping sustainable daily routines for ${goal}...`,
              `Breaking ${timelineDisplay} into daily checkpoints...`,
              'Writing your first 21-day fitness habit cards...',
              'Almost ready.'
            ];
          } else if (goalType === 'content') {
            dynamicSteps = [
              welcome,
              `Designing build-in-public checkpoints for ${goal}...`,
              `Breaking ${timelineDisplay} into weekly content buckets...`,
              'Writing your first 21-day content creation cards...',
              'Almost ready.'
            ];
          } else if (goalType === 'career') {
            dynamicSteps = [
              welcome,
              `Analyzing target role skill stacks and gaps for ${goal}...`,
              `Structuring your ${timelineDisplay} skill acquisition path...`,
              'Writing your first 21-day career transition cards...',
              'Almost ready.'
            ];
          } else if (goalType === 'relocation') {
            dynamicSteps = [
              welcome,
              `Auditing financial and visa milestones for ${goal}...`,
              `Breaking your ${timelineDisplay} relocation steps into sprints...`,
              'Writing your first 21-day relocation action cards...',
              'Almost ready.'
            ];
          }
          
          setSteps(dynamicSteps);
        }
      } catch (err) {
        console.warn('[BuildingPage] Could not load dynamic loading steps:', err);
      }

      try {
        const res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ conversationId }),
        });

        if (!res.ok) {
          throw new Error('Failed to generate plan');
        }

        setApiDone(true);
      } catch (err) {
        console.error('[BuildingPage] Plan generation error:', err);
        setApiError(true);
      }
    }

    triggerPlanGeneration();
  }, [searchParams]);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      // Last step — hold until API is done or errored
      if (apiDone) {
        const timer = setTimeout(() => {
          router.push('/dashboard');
        }, 1400);
        return () => clearTimeout(timer);
      }
      if (apiError) {
        const timer = setTimeout(() => {
          alert("We encountered an issue building your plan. Redirecting to start page to try again.");
          router.push('/start');
        }, 1400);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Fade out → swap text → fade back in
    const fadeOut = setTimeout(() => setVisible(false), 1600);
    const swap = setTimeout(() => {
      setStepIndex((i) => i + 1);
      setVisible(true);
    }, 1900);

    return () => {
      clearTimeout(fadeOut);
      clearTimeout(swap);
    };
  }, [stepIndex, router, apiDone, apiError, steps]);

  return (
    <>
      {/* Spinner */}
      <span className="loader mb-6"></span>

      {/* Animated copy */}
      <p
        key={stepIndex}
        className="font-sans font-medium text-[#1a1a1a] text-[22px] md:text-[28px] tracking-tight text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {apiError ? 'Plan generation failed.' : steps[stepIndex]}
      </p>
    </>
  );
}

export default function BuildingPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#F7F5EE' }}
    >
      <Suspense fallback={
        <div className="text-center py-6 flex flex-col items-center justify-center">
          <span className="loader"></span>
        </div>
      }>
        <BuildingClient />
      </Suspense>
    </main>
  );
}
