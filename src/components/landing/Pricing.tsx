import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started and building your first roadmap.",
    features: ["1 AI Life Plan", "Daily Telegram Nudges", "Basic Goal Tracking", "Community Support"],
    buttonText: "Start for free",
    href: "/start",
    variant: "secondary" as const,
  },
  {
    name: "Pro",
    price: "$3.99",
    period: "/mo",
    description: "For those serious about optimization and high-performance living.",
    features: ["Unlimited Life Plans", "Deep-dive Strategy Sessions", "Advanced Analytics", "Priority Support", "Custom Integrations"],
    buttonText: "Go Pro",
    href: "/pro",
    variant: "primary" as const,
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-8 max-w-7xl mx-auto w-full">
      <div className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif text-[#1a1a1a]">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-foreground/60 font-sans max-w-xl mx-auto">
            No hidden fees. Choose the plan that fits your ambition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative p-10 rounded-[2rem] border transition-all duration-300 hover:shadow-xl ${
                plan.highlight 
                ? 'bg-[#1a1a1a] text-white border-transparent' 
                : 'bg-white border-border/50 text-[#1a1a1a]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-10 -translate-y-1/2 bg-[#104d3b] text-white px-4 py-1 rounded-[999px] text-xs font-bold uppercase tracking-widest">
                  Recommended
                </div>
              )}
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-serif">{plan.price}</span>
                    {plan.period && <span className={plan.highlight ? 'text-white/60' : 'text-foreground/40'}>{plan.period}</span>}
                  </div>
                  <p className={`text-sm ${plan.highlight ? 'text-white/60' : 'text-foreground/60'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-[999px] ${plan.highlight ? 'bg-[#104d3b]' : 'bg-[#1a1a1a]'}`} />
                      <span className={plan.highlight ? 'text-white/80' : 'text-foreground/80'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className="block w-full">
                  <Button 
                    variant={plan.highlight ? 'primary' : 'secondary'} 
                    className={`w-full py-6 rounded-[999px] text-base font-medium ${
                      plan.highlight 
                      ? 'bg-white text-black hover:bg-white/90' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
