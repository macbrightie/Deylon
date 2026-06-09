"use client";

import Image from "next/image";

const steps = [
  {
    id: "step-1",
    number: "01",
    title: "Talk to Deylon",
    description:
      "Tell us about your life, your dream, where you're starting from, what's stopped you before. Not a form. A real conversation that actually listens.",
    image: "/UI-design-and-element/Card 1.webp",
  },
  {
    id: "step-2",
    number: "02",
    title: "Get your plan",
    description:
      "In minutes, Deylon builds a personal 5 or 10-year plan from your own words, broken into years, quarters, and daily actions you can actually do.",
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
  return (
    <section id="how-it-works" className="w-full bg-[#fdfdf8] py-20">
      <div className="max-w-7xl mx-auto w-full flex flex-col">
        {/* Section heading */}
        <div className="pb-16 text-center px-8">
          <h2 className="text-[32px] md:text-[52px] font-serif text-[#1a1a1a] leading-tight tracking-tight">
            A conversation. A plan. A daily guide
          </h2>
        </div>

        {/* Cards grid */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-16 md:gap-7 px-8 md:px-16">
          {steps.map((step, index) => (
            <StepCard key={step.id} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  return (
    <div
      className={`flex flex-col w-full max-w-[360px] md:max-w-[400px] gap-5 ${
        index === 1 ? "md:flex-col-reverse" : ""
      }`}
    >
      {/* Text block */}
      <div className="text-center px-2">
        <p className="text-[11px] font-sans font-semibold tracking-[0.18em] text-[#1a1a1a]/30 uppercase mb-2">
          {step.number}
        </p>
        <h3 className="text-[20px] md:text-[24px] font-serif text-[#1a1a1a] mb-2 leading-snug">
          {step.title}
        </h3>
        <p className="text-[13px] md:text-[14px] text-[#4e4e55] leading-relaxed font-sans">
          {step.description}
        </p>
      </div>

      {/* Card image */}
      <Image
        src={step.image}
        alt={step.title}
        width={800}
        height={960}
        className="w-full h-auto"
        sizes="(max-width: 768px) 90vw, 400px"
        priority={index === 0}
      />
    </div>
  );
}
