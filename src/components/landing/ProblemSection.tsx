"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

const slides = [
  "“You're not stuck because you lack ambition. You're stuck because no one ever gave you a clear map”.",
  "“You've tried writing goals. You've tried vision boards. You've downloaded apps and abandoned them by week two. \n\nNot because you're not capable, but because none of them actually knew you. They gave you templates built for someone else.",
  "The gap between the life you want and the life you're living isn't about motivation. It's about clarity. And a system that shows up with you every single day."
];

export function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const activeEnd = 0.9;

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const barWidth = useTransform(smoothProgress, [0, activeEnd], ["0%", "100%"]);
  
  const progressID = useTransform(smoothProgress, 
    [0, activeEnd * 0.33, activeEnd * 0.334, activeEnd * 0.66, activeEnd * 0.667, activeEnd], 
    ["1/3", "1/3", "2/3", "2/3", "3/3", "3/3"]
  );

  return (
    <section id="problem" ref={containerRef} className="relative h-[650vh] bg-black text-white">
      <div className="sticky top-0 h-screen w-full flex flex-col overflow-hidden">
        
        {/* Progress Bar Header */}
        <div className="absolute top-32 left-0 w-full px-8 md:px-24 flex flex-col gap-8 z-20">
          <div className="w-full h-[1px] bg-white/10 relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-white/60" 
              style={{ width: barWidth }}
            />
          </div>
          <div className="flex justify-between items-center">
            <motion.span className="px-4 py-1.5 rounded-[999px] bg-white/5 text-[10px] font-bold tracking-[0.2em] border border-white/5 text-white/40">
              {progressID}
            </motion.span>
          </div>
        </div>

        {/* Text Container */}
        <div className="flex-1 flex justify-end pt-56 px-8 md:px-24 relative">
          <div className="max-w-7xl w-full text-left relative h-full">
            {slides.map((text, slideIndex) => (
              <SlideText 
                key={slideIndex} 
                text={text} 
                index={slideIndex} 
                scrollYProgress={smoothProgress}
                activeEnd={activeEnd}
              />
            ))}
          </div>
        </div>

        <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-[#104d3b]/5 rounded-full blur-[150px] pointer-events-none" />
      </div>
    </section>
  );
}

function SlideText({ text, index, scrollYProgress, activeEnd }: { text: string; index: number; scrollYProgress: any; activeEnd: number }) {
  const segment = activeEnd / 3;
  const start = index * segment;
  const end = (index + 1) * segment;
  
  let inputRange: number[] = [];
  let outputRange: number[] = [];

  if (index === 0) {
    inputRange = [0, Math.max(0, end - 0.001), end];
    outputRange = [1, 1, 0];
  } else if (index === 1) {
    inputRange = [Math.max(0, start - 0.001), start, Math.max(0, end - 0.001), end];
    outputRange = [0, 1, 1, 0];
  } else {
    inputRange = [Math.max(0, start - 0.001), start, 1.0];
    outputRange = [0, 1, 1];
  }

  const opacity = useTransform(scrollYProgress, inputRange, outputRange);
  const y = useTransform(scrollYProgress, [Math.max(0, start - 0.01), start], [index === 0 ? 0 : 15, 0]);

  return (
    <motion.div 
      style={{ 
        opacity, 
        y, 
        position: "absolute",
        top: 0,
        right: 0,
        width: "100%",
        maxWidth: "850px", // Increased by another 30% to 850px
        pointerEvents: useTransform(opacity, (v) => v > 0.5 ? "auto" : "none"),
        display: useTransform(opacity, (v) => v > 0 ? "block" : "none")
      }}
      className="text-left"
    >
      <h2 className="text-[28px] md:text-[36px] lg:text-[42px] font-sans font-medium leading-[1.5] tracking-tight text-white/90 whitespace-pre-wrap">
        {text.split(" ").map((word, i) => {
          const readingStart = start;
          const readingEnd = start + (end - start) * 0.7; 
          
          const wordStart = readingStart + (i / text.split(" ").length) * (readingEnd - readingStart);
          const wordEnd = wordStart + (1 / text.split(" ").length) * (readingEnd - readingStart);
          
          const wordOpacity = useTransform(scrollYProgress, [wordStart, wordEnd], [0.15, 1]);
          
          return (
            <motion.span key={i} style={{ opacity: wordOpacity }} className="inline-block mr-[0.3em]">
              {word}
            </motion.span>
          );
        })}
      </h2>
    </motion.div>
  );
}
