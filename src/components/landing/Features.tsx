export function Features() {
  const features = [
    {
      title: "AI-Driven Personalization",
      description: "Not a template. A plan built specifically for your unique circumstances, personality, and constraints.",
    },
    {
      title: "Telegram Accountability",
      description: "No new app to download or check. We meet you where you already are with daily Telegram nudges.",
    },
    {
      title: "Adaptive Planning",
      description: "Life happens. Daylon learns from your progress and adapts your plan as your situation evolves.",
    },
    {
      title: "Privacy First",
      description: "Your life goals and personal data are encrypted and handled with the highest level of security.",
    },
  ];

  return (
    <section className="py-24 px-8 max-w-7xl mx-auto w-full border-t border-border/50 text-center">
      <div className="space-y-20">
        <div className="space-y-6 max-w-2xl mx-auto">
          <h2 className="text-[40px] md:text-[48px] font-serif text-[#1a1a1a] leading-tight">
            Designed for the way <br /> 
            <span className="text-[#9ca3af]">you actually live.</span>
          </h2>
          <p className="text-[18px] text-foreground/60 font-sans">
            Most planners fail because they're too rigid. Daylon is built to be as fluid and dynamic as your life.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {features.map((feature) => (
            <div key={feature.title} className="space-y-4">
              <h3 className="text-xl font-serif text-[#1a1a1a]">
                {feature.title}
              </h3>
              <p className="text-foreground/70 leading-relaxed font-sans text-sm max-w-[240px] mx-auto">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
