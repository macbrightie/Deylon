"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VoiceInput } from '../../../components/chat/VoiceInput';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

export function Conversation() {
  const router = useRouter();
  const [step, setStep] = useState<'chat' | 'email' | 'done'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi, I'm Daylon. I'm here to help you turn your biggest goals into a daily reality.",
    },
    {
      id: '2',
      role: 'assistant',
      content: "What's the one thing you've been wanting to change or achieve, but hdaylon't found the right path for yet?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const baseValueRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Map frontend message objects to backend ConversationMessage expected types
      const payloadMessages = newMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send onboarding message');
      }

      const data = await res.json() as { message: string; complete: boolean };

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "I'm listening. Tell me more.",
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If onboarding profile is complete, save transcript to cache and switch to email capture step
      if (data.complete) {
        localStorage.setItem("daylon_onboarding_transcript", JSON.stringify(newMessages.concat(assistantMsg)));
        setTimeout(() => {
          setStep('email');
        }, 2500); // 2.5 second delay so they can read Daylon's final complete sign-off message
      }
    } catch (error) {
      console.error('[Onboarding Chat Error]:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I hit a brief connection snag. Could you try sending that again?",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || loadingEmail) return;
    setLoadingEmail(true);
    try {
      const supabase = createClient();
      
      // Cache their email to pull on successful login
      localStorage.setItem("daylon_onboarding_email", email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (error) throw error;

      setStep('done');
    } catch (err) {
      console.error("[Email OTP Link Error]:", err);
      alert("We encountered an issue sending your magic link. Please check your email and try again.");
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[600px] bg-white rounded-[2.5rem] border border-border/50 shadow-2xl shadow-black/5 overflow-hidden">
      {step === 'chat' && (
        <>
          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-6 py-4 rounded-[1.5rem] text-[16px] font-sans leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-black text-white rounded-br-sm' 
                    : 'bg-[#f3f4f6] text-[#1a1a1a] rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f3f4f6] text-[#1a1a1a] rounded-[1.5rem] rounded-bl-sm px-6 py-4 flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-[#1a1a1a]/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#1a1a1a]/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#1a1a1a]/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSubmit}
            className="p-6 border-t border-border/50 flex items-center gap-4 bg-gray-50/50"
          >
            <div className="flex-1 relative flex items-center">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={loading ? "Daylon is writing..." : (isListening ? "Listening..." : "Type your answer here...")}
                disabled={loading}
                className="w-full h-14 rounded-[999px] border-border/50 bg-white pl-6 pr-14 font-sans text-[16px] focus-visible:ring-[#104d3b] disabled:bg-gray-100 disabled:opacity-60"
              />
              <div className="absolute right-3">
                <VoiceInput
                  onTranscript={(text) => {
                    setInput(baseValueRef.current ? `${baseValueRef.current} ${text}` : text);
                  }}
                  onListeningChange={(listening) => {
                    setIsListening(listening);
                    if (listening) {
                      baseValueRef.current = input;
                    }
                  }}
                  onListeningRestart={() => {
                    baseValueRef.current = input;
                  }}
                  className="h-10 w-10 flex items-center justify-center rounded-full text-[#104d3b] hover:bg-gray-100 transition-colors"
                >
                  {(activeListening) => (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {activeListening ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="w-5 h-5 text-[#104d3b]"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 hover:text-[#104d3b] transition-colors">
                          <path d="M10 3a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" fill="currentColor"/>
                          <path d="M16 10a1 1 0 0 1-1 1 5.002 5.002 0 0 1-9.9 0 1 1 0 1 1-1.9 0v-.5a1 1 0 0 1 1.9 0v.5a3.003 3.003 0 0 0 5.9 0v-.5a1 1 0 1 1 1.9 0v.5a5.002 5.002 0 0 1-5 5v1.5H8a1 1 0 0 1 0 2h4a1 1 0 0 1 0-2h-1.5V16.9a5.002 5.002 0 0 1 4.5-5.9z" fill="currentColor"/>
                        </svg>
                      )}
                    </div>
                  )}
                </VoiceInput>
              </div>
            </div>
            <Button 
              type="submit"
              disabled={!input.trim() || loading}
              className="h-14 w-14 rounded-[999px] bg-[#104d3b] hover:bg-[#0d3f30] text-white p-0 flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 2.5L2.5 9.16667L8.33333 11.6667L10.8333 17.5L17.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </form>
        </>
      )}

      {step === 'email' && (
        <div className="flex-1 flex flex-col justify-center px-10 md:px-16 pb-10">
          <div className="relative">
            <p className="text-[16px] md:text-[18px] font-sans text-[#1a1a1a] leading-relaxed mb-8 max-w-md">
              {loadingEmail 
                ? "Sending your magic link now..." 
                : "One last thing, where should I send your plan? I'll save it so you can always pick up right where you left off."}
            </p>

            <div
              className={`flex items-center gap-0 pb-2 mb-8 max-w-sm border-b-2 transition-colors duration-200 ${
                email.trim() ? "border-[#1a1a1a]" : "border-[#1a1a1a]/15"
              }`}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loadingEmail}
                placeholder="enter email address"
                className="flex-1 text-[20px] md:text-[24px] font-sans text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 bg-transparent outline-none disabled:opacity-50"
                onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
              />
            </div>

            <button
              onClick={handleEmailSubmit}
              disabled={loadingEmail || !email.trim()}
              className="w-11 h-11 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
            >
              {loadingEmail ? (
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                  <path
                    fillRule="evenodd"
                    d="M10 17a1 1 0 01-1-1V6.414l-2.293 2.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 01-1 1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="flex-1 flex flex-col justify-center px-10 md:px-16 pb-10 text-left">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full border border-[#1a1a1a]/25 flex items-center justify-center mt-0.5">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-5 h-5 text-[#1a1a1a]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 10.5l4.5 4.5 6.5-9"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[16px] md:text-[18px] font-sans text-[#1a1a1a] leading-relaxed max-w-sm pt-1.5">
                  <b>Magic link sent!</b> Click the confirmation link in your email to instantly log in and access your personal Daylon coach plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
