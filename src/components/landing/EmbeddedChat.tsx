"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceInput } from "../../../components/chat/VoiceInput";

// ─── Types ──────────────────────────────────────────────────────────────────

type ChatState = "idle" | "chatting" | "email" | "done";

interface Message {
  id: string;
  role: "deylon" | "me";
  text: string;
}

// ─── Reaction icons ──────────────────────────────────────────────────────────

function ReactionBar() {
  const [active, setActive] = useState<string | null>(null);

  const icons = [
    { id: "copy", src: "/UI-design-and-element/iconsax-copy.svg", alt: "Copy" },
    { id: "volume", src: "/UI-design-and-element/iconsax-volume-high.svg", alt: "Volume" },
    { id: "like", src: "/UI-design-and-element/iconsax-like.svg", alt: "Like" },
    { id: "dislike", src: "/UI-design-and-element/iconsax-dislike.svg", alt: "Dislike" },
  ];

  return (
    <div className="flex items-center gap-4 pt-2 pb-1">
      {icons.map((icon) => (
        <button
          key={icon.id}
          onClick={() => setActive(active === icon.id ? null : icon.id)}
          className={`w-[18px] h-[18px] opacity-40 hover:opacity-100 transition-all duration-150 relative ${
            active === icon.id ? "opacity-100 scale-110" : ""
          }`}
        >
          <Image
            src={icon.src}
            alt={icon.alt}
            fill
            className="object-contain"
          />
        </button>
      ))}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[#1a1a1a]/40 font-sans py-1">
      <svg
        className="animate-spin w-4 h-4 text-[#1a1a1a]/30"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      Deylon is writing...
    </div>
  );
}

// ─── Chat message ────────────────────────────────────────────────────────────

function ChatMessage({
  message,
  isLast,
  showReactions,
}: {
  message: Message;
  isLast: boolean;
  showReactions: boolean;
}) {
  const isDeylon = message.role === "deylon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-1"
    >
      <p
        className={`text-[11px] font-sans font-semibold tracking-wide mb-1 ${
          isDeylon ? "text-[#1a1a1a]" : "text-[#104d3b]"
        }`}
      >
        {isDeylon ? "Deylon" : "Me"}
      </p>
      <div className="relative pl-3.5">
        <div
          className={`absolute left-0 top-[3px] bottom-[3px] w-[3px] rounded-full ${
            isDeylon ? "bg-[#1a1a1a]/35" : "bg-[#104d3b]"
          }`}
        />
        <p className="text-[13px] md:text-[14px] text-[#1a1a1a] font-sans leading-relaxed">
          {message.text}
        </p>
      </div>
      {isLast && showReactions && <ReactionBar />}
    </motion.div>
  );
}

// ─── Chat panel (live chat) ──────────────────────────────────────────────────

interface ChatPanelProps {
  state: "idle" | "chatting";
  messages: Message[];
  onSend: (text: string) => Promise<void>;
  generating: boolean;
}

function ChatPanel({
  state,
  messages,
  onSend,
  generating,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const baseValueRef = useRef("");

  const hasText = inputValue.trim().length > 0;

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, generating]);

  function handleSend() {
    if (!hasText || generating) return;
    onSend(inputValue);
    setInputValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages — 60% width of container, centred */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pt-6 pb-2 space-y-5 scrollbar-none"
      >
        <div className="w-full px-[12px] md:w-[60%] md:px-0 mx-auto space-y-5">
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
            showReactions={state === "chatting"}
          />
        ))}
        {generating && <Spinner />}
        </div>
      </div>

      {/* Input bar — also 60% width on md, full width with 12px padding on mobile */}
      <div className="w-full px-[12px] md:w-[60%] md:px-0 mx-auto pb-6 pt-3 flex-shrink-0">
        <div
          className="rounded-[20px] border border-[#1a1a1a]/10 transition-all duration-300 overflow-hidden bg-white shadow-sm flex flex-col"
        >
          {/* White textarea */}
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={generating}
            placeholder={
              generating 
                ? "Deylon is writing..." 
                : (isListening ? "Listening..." : "Reply...")
            }
            rows={2}
            className="w-full pl-4 pr-4 pt-3.5 pb-0 text-[14px] font-sans text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 bg-white resize-none outline-none leading-normal disabled:bg-gray-50/50"
          />

          {/* Bottom Button Bar Zone */}
          <div
            onClick={handleSend}
            className="relative w-full h-[50px] bg-white overflow-hidden flex flex-col cursor-pointer select-none"
          >
            {/* Full-width Curve SVG as the top edge of the button */}
            <div className="w-full -mb-[1px] select-none pointer-events-none">
              <svg
                viewBox="0 0 470 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto block"
              >
                <g clipPath="url(#clip0_719_26716)">
                  <path
                    d="M470 36H0V0C6.44276e-08 6.62742 5.37258 12 12 12H458C464.627 12 470 6.62742 470 0V36Z"
                    fill={hasText && !generating ? "#104d3b" : "#fcfaf6"}
                    className="transition-colors duration-300"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_719_26716">
                    <rect width="470" height="36" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>

            {/* Solid filling block underneath the SVG */}
            <div
              className="flex-1 w-full transition-colors duration-300 -mt-[1px]"
              style={{ backgroundColor: hasText && !generating ? "#104d3b" : "#fcfaf6" }}
            />

            {/* Centered Icon button */}
            <div className="absolute inset-x-0 bottom-0 top-[12px] flex items-center justify-center pointer-events-none">
              {hasText && !isListening ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSend();
                  }}
                  disabled={generating}
                  className="flex items-center justify-center w-10 h-10 pointer-events-auto disabled:opacity-50"
                  aria-label="Send message"
                >
                  <div className="relative w-5 h-5">
                    <Image
                      src="/UI-design-and-element/arrow-up.svg"
                      alt="Send"
                      fill
                      className="object-contain brightness-0 invert"
                    />
                  </div>
                </button>
              ) : (
                <VoiceInput
                  onTranscript={(text) => {
                    setInputValue(baseValueRef.current ? `${baseValueRef.current} ${text}` : text);
                  }}
                  onListeningChange={(listening) => {
                    setIsListening(listening);
                    if (listening) {
                      baseValueRef.current = inputValue;
                    }
                  }}
                  onListeningRestart={() => {
                    baseValueRef.current = inputValue;
                  }}
                  className="flex items-center justify-center w-10 h-10 pointer-events-auto disabled:opacity-50"
                >
                  {(activeListening) => (
                    <div className="relative w-6 h-6 flex items-center justify-center">
                      {activeListening ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="w-5 h-5 text-[#104d3b] animate-pulse"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <Image
                          src="/UI-design-and-element/voiceprint.svg"
                          alt="Voice input"
                          fill
                          className="object-contain animate-pulse"
                        />
                      )}
                    </div>
                  )}
                </VoiceInput>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Email capture panel ─────────────────────────────────────────────────────

interface EmailPanelProps {
  onSubmit: (email: string) => Promise<void>;
  loading: boolean;
}

function EmailPanel({ onSubmit, loading }: EmailPanelProps) {
  const [email, setEmail] = useState("");

  function handleSubmit() {
    if (!email.trim() || loading) return;
    onSubmit(email);
  }

  return (
    <div className="flex-1 flex flex-col justify-center px-10 md:px-16 pb-10">
      <div className="relative">
        <p className="text-[15px] md:text-[17px] font-sans text-[#1a1a1a] leading-relaxed mb-8 max-w-md">
          {loading 
            ? "Sending your magic link now..." 
            : "One last thing, where should I send your plan? I'll save it so you can always pick up right where you left off."}
        </p>

        {/* Border only visible when email has text */}
        <div
          className={`flex items-center gap-0 pb-2 mb-8 max-w-sm border-b-2 transition-colors duration-200 ${
            email.trim() ? "border-[#1a1a1a]" : "border-transparent"
          }`}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="enter email address"
            className="flex-1 text-[20px] md:text-[24px] font-sans text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 bg-transparent outline-none disabled:opacity-50"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim()}
          className="w-11 h-11 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? (
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

      {/* Bottom warm glow — behind content */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[120px] bg-[#f5d9a0]/40 blur-[60px] rounded-full pointer-events-none z-[-1]" />
    </div>
  );
}

// ─── Go to Dashboard Button ───────────────────────────────────────────────────

function GoToDashboardButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/dashboard')}
      className="px-8 py-4 bg-[#1a1a1a] text-white font-sans text-[14px] font-medium rounded-full hover:bg-[#333] transition-colors tracking-wide cursor-pointer"
    >
      Go to Dashboard
    </button>
  );
}

// ─── Dashboard panel ─────────────────────────────────────────────────────────

function DashboardPanel() {
  return (
    <div className="flex-1 flex flex-col justify-center px-10 md:px-16 pb-10 relative">
      <div className="space-y-6">
        {/* Checkmark + message */}
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
          <p className="text-[15px] md:text-[17px] font-sans text-[#1a1a1a] leading-relaxed max-w-sm pt-1.5">
            <b>Magic link sent!</b> Click the confirmation link in your email to instantly log in and access your personal Deylon coach plan.
          </p>
        </div>

        {/* CTA button */}
        <div>
          <GoToDashboardButton />
        </div>
      </div>

      {/* Bottom warm glow — behind content */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[120px] bg-[#f5d9a0]/40 blur-[60px] rounded-full pointer-events-none z-[-1]" />
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface EmbeddedChatProps {
  userId?: string;
  conversationId?: string;
  initialMessages?: Message[];
  isDashboard?: boolean;
  onCompleteOnboarding?: (conversationId: string) => void;
}

export function EmbeddedChat({
  userId,
  conversationId,
  initialMessages,
  isDashboard = false,
  onCompleteOnboarding,
}: EmbeddedChatProps) {
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [messages, setMessages] = useState<Message[]>(initialMessages || [
    {
      id: "m1",
      role: "deylon",
      text: "Hi, I'm Deylon. I'm here to help you turn your biggest goals into a daily reality.",
    },
    {
      id: "m2",
      role: "deylon",
      text: "What's the one thing you've been wanting to change or achieve, but hdeylon't found the right path for yet? Tell me freely.",
    },
  ]);
  const [generating, setGenerating] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      setChatState("chatting");
    }
  }, [initialMessages]);

  async function handleSend(text: string) {
    if (!text.trim() || generating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "me",
      text: text,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setGenerating(true);
    setChatState("chatting");

    try {
      // Map frontend messages to backend expected roles
      const payloadMessages = newMessages.map((m) => ({
        role: m.role === 'deylon' ? 'assistant' as const : 'user' as const,
        content: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: payloadMessages,
          conversationId: conversationId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message to Deylon");
      }

      const data = await res.json() as { message: string; complete: boolean };

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "deylon",
        text: data.message || "I'm listening. Tell me more.",
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If onboarding is complete, save transcript and advance to Email capture
      if (data.complete) {
        if (isDashboard && onCompleteOnboarding && conversationId) {
          setGeneratingPlan(true);
          setTimeout(() => {
            onCompleteOnboarding(conversationId);
          }, 2000);
        } else {
          localStorage.setItem("deylon_onboarding_transcript", JSON.stringify(newMessages.concat(assistantMsg)));
          setTimeout(() => {
            setChatState("email");
          }, 2500); // Elegant delay so the user can digest the final Deylon onboarding message
        }
      }
    } catch (error) {
      console.error("[EmbeddedChat Chat Error]:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "deylon",
        text: "I'm sorry, I hit a brief connection snag. Could you try sending that again?",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleEmailSubmit(email: string) {
    setLoadingEmail(true);
    try {
      // Cache their email to pull on successful login
      localStorage.setItem("deylon_onboarding_email", email);

      const { sendMagicLinkOrBypass } = await import('@/lib/supabase/auth-helper');
      const { error, bypassed } = await sendMagicLinkOrBypass(email, `${window.location.origin}/verify`);

      if (error) throw error;

      if (!bypassed) {
        setChatState("done");
      }
    } catch (err) {
      console.error("[Email OTP Link Error]:", err);
      alert("We encountered an issue sending your magic link. Please check your email and try again.");
    } finally {
      setLoadingEmail(false);
    }
  }

  const content = (
    <div className="max-w-[960px] mx-auto rounded-[28px] bg-[#1a1a1a] overflow-hidden shadow-2xl relative">
      {/* Top-cont asset */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 min-w-[160px] z-10">
        <div className="relative w-full">
          <Image
            src="/UI-design-and-element/Top-cont.webp"
            alt=""
            width={400}
            height={100}
            className="w-full h-auto"
            priority
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-[9px] md:text-[11px] uppercase pb-[18px] text-white/55"
            style={{
              fontFamily: 'var(--font-haffer-xh-mono)',
              fontWeight: 500,
              letterSpacing: '0.22em',
            }}
          >
            Talk to Deylon
          </span>
        </div>
      </div>

      {/* Top dark header */}
      <div className="px-8 pt-16 pb-8 relative">
        <div className="text-center">
          <p className="text-[20px] md:text-[24px] font-sans text-white leading-snug">
            <span className="text-white/40">Start here.</span>{" "}
            <span className="text-white font-medium">
              Your plan is 5 minutes away.
            </span>
          </p>
          <p className="mt-3 text-[12px] font-mono tracking-wide">
            <span className="text-[#BDBDBF]">Take your time, Talk freely.</span>{" "}
            <span className="text-white font-semibold">
              Deylon will handle the rest.
            </span>
          </p>
        </div>
      </div>

      {/* Inner white chat card */}
      <div className="mx-[2px] mb-[2px] rounded-b-[26px] rounded-t-[20px] bg-white overflow-hidden h-[450px] md:h-[500px] flex flex-col">
        <AnimatePresence mode="wait">
          {generatingPlan ? (
            <motion.div
              key="generatingPlan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <svg className="animate-spin w-10 h-10 text-[#104d3b] mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <p className="text-[16px] font-sans font-medium text-[#1a1a1a]">
                Preparing to build your plan...
              </p>
            </motion.div>
          ) : (chatState === "idle" || chatState === "chatting") ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col flex-1 h-full"
            >
              <ChatPanel
                state={chatState === "idle" ? "idle" : "chatting"}
                messages={messages}
                onSend={handleSend}
                generating={generating}
              />
            </motion.div>
          ) : chatState === "email" ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col flex-1 relative pt-10"
            >
              <EmailPanel onSubmit={handleEmailSubmit} loading={loadingEmail} />
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col flex-1 relative pt-10"
            >
              <DashboardPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  if (isDashboard) {
    return (
      <div className="w-full">
        {content}
      </div>
    );
  }

  return (
    <section
      id="embedded-chat"
      className="py-20 md:py-28 px-6 md:px-12 bg-[#F7F5EE]"
    >
      {/* Heading */}
      <div className="text-center mb-24">
        <h2 className="text-[36px] md:text-[56px] font-serif text-[#1a1a1a] leading-tight tracking-tight">
          Where do you see yourself?
        </h2>
      </div>

      {content}

      {/* Dev state switcher */}
      {process.env.NODE_ENV === "development" && (
        <div className="flex justify-center gap-3 mt-6">
          {(["idle", "chatting", "email", "done"] as ChatState[]).map((s) => (
            <button
              key={s}
              onClick={() => setChatState(s)}
              className={`px-3 py-1 text-[11px] font-mono rounded border transition-all ${
                chatState === s
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "text-[#1a1a1a]/50 border-[#1a1a1a]/20 hover:border-[#1a1a1a]/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

