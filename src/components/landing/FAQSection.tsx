"use client";

import { useState } from 'react';

const faqs = [
  {
    question: "How does the AI life planning work?",
    answer: "Daylon uses advanced AI to analyze your goals, habits, and constraints shared during our initial deep-dive conversation. It then synthesizes this into a structured, executable roadmap broken down by year, month, and day.",
  },
  {
    question: "Is Daylon really free to start?",
    answer: "Yes! You can build your first life plan and receive daily Telegram nudges completely for free. We offer a 'Pro' tier for those who want more frequent deep-dives, custom integrations, and advanced goal tracking.",
  },
  {
    question: "Why use Telegram for daily nudges?",
    answer: "We believe in meeting you where you already are. Instead of asking you to download another app you'll eventually forget to check, Daylon sends your daily priorities straight to your favorite messaging app.",
  },
  {
    question: "How is my data handled?",
    answer: "Your privacy is our priority. All conversations and plan data are encrypted. We never sell your data, and you have full control over what information you share with the AI.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-8 max-w-4xl mx-auto w-full">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif text-[#1a1a1a]">
            Common Questions
          </h2>
          <p className="text-lg text-foreground/60 font-sans">
            Everything you need to know about Daylon.
          </p>
        </div>

        <div className="divide-y divide-border/50">
          {faqs.map((faq, index) => (
            <div key={index} className="py-6">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full text-left group"
              >
                <span className="text-xl font-serif text-[#1a1a1a] group-hover:text-[#104d3b] transition-colors">
                  {faq.question}
                </span>
                <span className={`text-2xl transition-transform duration-300 ${openIndex === index ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              {openIndex === index && (
                <div className="mt-4 text-foreground/70 leading-relaxed font-sans animate-in fade-in slide-in-from-top-2">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
