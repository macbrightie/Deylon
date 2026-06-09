'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const words = [
  "starting a business",
  "getting fit",
  "changing careers",
  "relocating",
  "building a following"
];

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      const t = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fullText = words[wordIndex];
    
    if (isDeleting) {
      // Deleting speed
      timer = setTimeout(() => {
        setCurrentText(fullText.substring(0, currentText.length - 1));
      }, 40);
    } else {
      // Typing speed
      timer = setTimeout(() => {
        setCurrentText(fullText.substring(0, currentText.length + 1));
      }, 75);
    }

    // Pause when fully typed
    if (!isDeleting && currentText === fullText) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } 
    // Pause when fully deleted
    else if (isDeleting && currentText === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      timer = setTimeout(() => {}, 500);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, wordIndex]);

  return (
    <section className="flex flex-col items-center justify-center min-h-[100dvh] py-16 px-8 max-w-7xl mx-auto w-full text-center">
      <div className="max-w-5xl flex flex-col items-center">
        {/* Heading with smooth Typing animation */}
        <h1 className="font-serif leading-[1.2] tracking-tight">
          {/* First Line: Always on one line, color #4e4e55 */}
          <span className="block text-[32px] sm:text-[44px] md:text-[60px] lg:text-[68px] text-[#4e4e55]">
            Your dream of{" "}
            <span className="text-[#104d3b] font-semibold inline-block pr-1 relative ml-[3px]">
              {currentText}
              <span className="inline-block w-[3px] h-[32px] sm:h-[40px] md:h-[50px] lg:h-[56px] bg-[#104d3b] ml-1 animate-pulse align-middle -mt-1" />
            </span>
          </span>

          {/* Second Line: Slightly larger font size to stay on one line for desktop and wrap below */}
          <span className="block text-[26px] sm:text-[35px] md:text-[48px] lg:text-[54px] text-[#1a1a1a] mt-2 font-serif">
            becomes what you do tomorrow morning.
          </span>
        </h1>

        {/* Subheading - exactly 20px away */}
        <p className="mt-5 text-[18px] text-[#4e4e55] max-w-2xl leading-relaxed font-sans">
          Tell us where you are. Deylon builds the rest.
        </p>

        {/* Button Group - pulled up */}
        <div className="mt-[14px] flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <a href="#embedded-chat">
              <Button 
                variant="primary" 
                size="lg" 
                className="rounded-[999px] px-10 py-3 text-base font-medium bg-black text-white hover:bg-black/90 shadow-xl shadow-black/20 border border-white"
              >
                Start my plan
              </Button>
            </a>
          </div>
          <p className="text-[14px] text-[#8B8B81] font-medium font-sans">
            Free · 8 minutes · No credit card.
          </p>
        </div>
          
        {/* Avatar Section - pulled up */}
        <div className="mt-[14px] flex items-center gap-4">
          <div className="flex -space-x-3">
            {[
              "/UI-design-and-element/Image 1.png",
              "/UI-design-and-element/Image 2.png",
              "/UI-design-and-element/Image 3.png",
              "/UI-design-and-element/BRIGHT MBA AVI 2 1.png"
            ].map((src, idx) => (
              <div 
                key={idx} 
                className="w-9 h-9 rounded-[999px] border-2 border-background bg-muted flex items-center justify-center overflow-hidden relative"
              >
                <img 
                  src={src} 
                  alt={`User avatar ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="text-[15px] font-medium text-foreground/60 font-sans">
            Join <span className="font-bold text-[#1a1a1a]">100+</span> people building their path
          </p>
        </div>
      </div>
    </section>
  );
}
