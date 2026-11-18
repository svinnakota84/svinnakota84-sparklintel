import React from "react";
import { Check, Crown, Sparkles } from "lucide-react";
import { SubscriptionTier } from "../types";

interface SubscriptionViewProps {
  currentTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
  onReturnToStudio: () => void;
}

const PLANS: {
  id: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}[] = [
  {
    id: "free",
    name: "Starter Preview",
    price: "$0",
    period: "Forever",
    description:
      "Explore residential construction blueprints and 3 classic 3D kitchen color combinations.",
    features: [
      "4 engineering construction floor plans",
      "3 classic 3D cabinet color combinations",
      "Standard Shaker & Slab 3D doors",
      "Starter dining, stools & sofa selection",
      "Vastu & Astrology AI advisor access",
    ],
    cta: "Use Starter Plan",
  },
  {
    id: "pro",
    name: "Architect Pro",
    price: "$29",
    period: "per month",
    description:
      "Unlocks every designer cabinet color combination, stone countertop, and custom 3D finish mixer.",
    features: [
      "All 12 bespoke 3D cabinet & kitchen color palettes",
      "Independent 7-part Custom Color & Material Mixer",
      "Fluted timber & backlit Glass Vitrine 3D doors",
      "Calacatta Gold, Nero Marquina & Taj Quartzite stones",
      "Full 3D furniture & designer pendant lighting suite",
      "Downloadable structural & BOM specification sheets",
    ],
    cta: "Unlock Architect Pro",
    highlighted: true,
  },
  {
    id: "studio",
    name: "Turnkey Studio",
    price: "$79",
    period: "per month",
    description:
      "Complete builder & homebuyer suite with full CAD specs, multi-layout 3D views, and Vastu audits.",
    features: [
      "Everything in Architect Pro unlocked",
      "All 3 Kitchen Layouts (L-Island, Galley, U-Chef) in 3D",
      "Unlimited Vastu Shastra & Rashi house-buying audits",
      "Priority architectural MEP & joinery schedules",
      "Client-ready shareable configuration exports",
    ],
    cta: "Activate Turnkey Studio",
  },
];

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  currentTier,
  onSelectTier,
  onReturnToStudio,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-16">
      <div className="max-w-2xl">
        <p className="text-xs font-mono text-[#B45309] tracking-wide">
          Full 3D Material Studio &amp; Engineering Access
        </p>
        <h1 className="font-display text-2xl sm:text-4xl font-semibold text-[#141517] mt-1">
          Unlock Every Kitchen Color Combination &amp; 3D View
        </h1>
        <p className="text-sm sm:text-base text-[#57534E] mt-2 leading-relaxed">
          Subscribe to unlock all 12+ designer cabinet palettes, exotic marble
          &amp; quartzite slabs, fluted &amp; glass vitrine 3D doors, custom
          material mixing, and downloadable construction engineering specs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8 items-stretch">
        {PLANS.map((plan) => {
          const isActive = currentTier === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                plan.highlighted
                  ? "bg-[#141517] text-white border-[#141517] shadow-lg"
                  : "bg-white text-[#141517] border-black/10"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={
                      plan.highlighted ? "text-[#F59E0B]" : "text-[#B45309]"
                    }
                  >
                    {plan.id === "free"
                      ? "TIER 01"
                      : plan.id === "pro"
                      ? "MOST POPULAR"
                      : "FULL SUITE"}
                  </span>
                  {isActive && (
                    <span
                      className={`font-semibold ${
                        plan.highlighted ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      Active Plan
                    </span>
                  )}
                </div>

                <h2 className="font-display text-2xl font-semibold mt-2 flex items-center gap-2">
                  <span>{plan.name}</span>
                  {plan.id !== "free" && (
                    <Crown
                      className={`w-4 h-4 ${
                        plan.highlighted ? "text-[#F59E0B]" : "text-[#B45309]"
                      }`}
                    />
                  )}
                </h2>

                <div className="mt-4 flex items-baseline gap-1.5 tabular-nums">
                  <span className="font-display text-4xl font-semibold">
                    {plan.price}
                  </span>
                  <span
                    className={`text-xs ${
                      plan.highlighted ? "text-white/70" : "text-[#78716C]"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <p
                  className={`text-xs mt-3 leading-relaxed ${
                    plan.highlighted ? "text-white/80" : "text-[#57534E]"
                  }`}
                >
                  {plan.description}
                </p>

                <ul className="mt-6 space-y-2.5 text-xs">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.highlighted ? "text-[#F59E0B]" : "text-[#B45309]"
                        }`}
                      />
                      <span
                        className={
                          plan.highlighted ? "text-white/90" : "text-[#141517]"
                        }
                      >
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-current/10">
                <button
                  onClick={() => {
                    onSelectTier(plan.id);
                    if (plan.id !== "free") {
                      onReturnToStudio();
                    }
                  }}
                  className={`w-full min-h-[46px] rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isActive
                      ? plan.highlighted
                        ? "bg-[#B45309] text-white hover:bg-[#92400E]"
                        : "bg-[#EFECE6] text-[#141517]"
                      : plan.highlighted
                      ? "bg-[#F59E0B] text-[#141517] hover:bg-[#D97706] hover:text-white"
                      : "bg-[#141517] text-white hover:bg-[#292B2F]"
                  }`}
                >
                  {plan.id !== "free" && <Sparkles className="w-4 h-4" />}
                  <span>
                    {isActive
                      ? plan.id === "free"
                        ? "Current Plan"
                        : "Active — Open 3D Studio"
                      : plan.cta}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
