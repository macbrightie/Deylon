'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function GodModeWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Safety lock: ensure this never works for regular users in production
      if (
        user?.email?.includes('+test@') || 
        process.env.NODE_ENV === 'development' || 
        process.env.NEXT_PUBLIC_ENABLE_GOD_MODE === 'true'
      ) {
        setIsVisible(true);
      }
    }
    checkAccess();
  }, []);

  if (!isVisible) return null;

  const handleTimeTravel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/time-travel', { method: 'POST' });
      if (!res.ok) throw new Error('Time travel failed');
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Time travel failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button 
        onClick={handleTimeTravel}
        disabled={loading}
        className="px-5 py-3 bg-[#104D3B] text-white rounded-full shadow-2xl font-sans font-bold text-[14px] hover:bg-[#0c392c] hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 border border-white/20"
        title="Simulate 24 hours passing to unlock the next day"
      >
        <span>{loading ? '⏳' : '⏩'}</span>
        {loading ? 'Traveling...' : 'God Mode: Fast Forward'}
      </button>
    </div>
  );
}
