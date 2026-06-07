"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    id: "step-1",
    number: "01",
    title: "Talk to Daylon",
    description:
      "Tell us about your life, your dream, where you're starting from, what's stopped you before. Not a form. A real conversation that actually listens.",
    image: "/UI-design-and-element/Card 1.webp",
  },
  {
    id: "step-2",
    number: "02",
    title: "Get your plan",
    description:
      "In minutes, Daylon builds a personal 5 or 10-year plan from your own words, broken into years, quarters, and daily actions you can actually do.",
    image: "/UI-design-and-element/card-2.webp",
  },
  {
    id: "step-3",
    number: "03",
    title: "Show up everyday",
    description:
      "Each morning, flip your daily card. See exactly what to do. Get a dedicated reminder. Watch your 30-day challenge fill up, one box at a time.",
    image: "/UI-design-and-element/Card 3.webp",
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

  // The scroll range is the height of the sticky container minus the viewport
  // We give enough scroll room for 3 cards to animate in
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative md:h-[280vh]"
    >
      {/* Sticky viewport container on desktop, normal flow on mobile */}
      <div className="md:sticky md:top-0 min-h-screen md:h-[85vh] w-full md:overflow-hidden bg-[#fdfdf8] flex flex-col">
        {/* Section heading */}
        <div className="pt-20 pb-10 text-center flex-shrink-0 px-8">
          <h2 className="text-[32px] md:text-[52px] font-serif text-[#1a1a1a] leading-tight tracking-tight">
            A conversation. A plan. A daily guide
          </h2>
        </div>

        {/* Cards grid — each card animates in as you scroll */}
        <div className="flex-1 flex flex-col md:flex-row items-center md:items-start justify-center gap-16 md:gap-7 px-8 md:px-16 pb-20 md:pb-10 relative">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              scrollProgress={smoothProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  scrollProgress,
}: {
  step: (typeof steps)[0];
  index: number;
  scrollProgress: any;
}) {
  // Each card animates in during its own third of the scroll range
  const segmentSize = 0.25;
  const segmentStart = index * segmentSize;
  const segmentEnd = segmentStart + segmentSize;

  // Fade + slide in when entering — stays visible for the rest of scroll
  const opacity = useTransform(
    scrollProgress,
    index === 0
      ? [0, 1]
      : [
          segmentStart - 0.01,
          segmentStart,
          segmentEnd,
          segmentEnd + 0.01,
        ],
    index === 0 ? [1, 1] : [0, 0, 1, 1]
  );

  const y = useTransform(
    scrollProgress,
    index === 0 
      ? [0, 1] 
      : [segmentStart - 0.01, segmentStart, segmentEnd],
    index === 0 ? [0, 0] : [60, 60, 0]
  );

  // Card 2 has a slight delay feel via a higher start
  const scale = useTransform(
    scrollProgress,
    index === 0 ? [0, 1] : [segmentStart, segmentEnd],
    index === 0 ? [1, 1] : [0.96, 1]
  );

  // Text-block animate in same timing
  const textOpacity = useTransform(
    scrollProgress,
    index === 0 ? [0, 1] : [segmentStart, segmentStart + segmentSize * 0.6],
    index === 0 ? [1, 1] : [0, 1]
  );

  const textY = useTransform(
    scrollProgress,
    index === 0 ? [0, 1] : [segmentStart, segmentStart + segmentSize * 0.6],
    index === 0 ? [0, 0] : [20, 0]
  );

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className={`flex flex-col w-full max-w-[360px] md:max-w-[400px] gap-5 ${
        index === 1 ? "md:flex-col-reverse" : ""
      }`}
    >
      {/* Text block */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="text-center px-2"
      >
        <p className="text-[11px] font-sans font-semibold tracking-[0.18em] text-[#1a1a1a]/30 uppercase mb-2">
          {step.number}
        </p>
        <h3 className="text-[20px] md:text-[24px] font-serif text-[#1a1a1a] mb-2 leading-snug">
          {step.title}
        </h3>
        <p className="text-[13px] md:text-[14px] text-[#4e4e55] leading-relaxed font-sans">
          {step.description}
        </p>
      </motion.div>

      {/* Card image — rendered naturally; the webp already has its own shape/corners */}
      <Image
        src={step.image}
        alt={step.title}
        width={800}
        height={960}
        className="w-full h-auto"
        sizes="(max-width: 768px) 90vw, 400px"
        priority={index === 0}
      />
    </motion.div>
  );
}
