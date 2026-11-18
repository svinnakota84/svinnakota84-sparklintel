import React, { useState } from "react";
import { Check, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { SubscriptionTier } from "../types";

interface SubscriptionViewProps {
  currentTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
  onReturnToStudio: () => void;
}

const PLANS: {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}[] = [
  {
    id: "free",
    name: "Starter Preview",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "Forever free",
    description:
      "Explore Surya Courtyard floor plan, 3 classic 3D kitchen color combinations, and Vastu & Astrology AI.",
    features: [
      "Surya Courtyard structural plan (Bedrooms, Toilets & Kitchen)",
      "3 classic 3D cabinet color combinations",
      "Standard Shaker & Slab 3D doors + L-Island view",
      "Starter dining, stools, sofa & boundary casting preview",
      "24/7 Vastu Shastra & House-Buying AI Advisor",
    ],
    cta: "Use Starter Plan",
  },
  {
    id: "pro",
    name: "Architect Pro",
    monthlyPrice: 29,
    annualPrice: 23,
    period: "per month",
    description:
      "Unlock direct George Buildings & Sophia Key vendor storefronts, custom wall paint colors across all 4 plans, and all 12 3D kitchen palettes.",
    features: [
      "Direct shopping & ordering links to George Buildings & Sophia Key stores",
      "All 10 Sophia Key & George 3D furniture pieces with floor drag-and-drop",
      "All 4 structural engineering plans (Bedrooms, Toilets, Kitchen & Living)",
      "Unlimited custom wall paint colors (Hex & swatch palette) per room & facade",
      "All 12 designer 3D cabinet palettes + Fluted & Glass Vitrine doors",
      "All 6 3D casting structures + 8 residential/commercial casting systems",
    ],
    cta: "Unlock Architect Pro",
    highlighted: true,
  },
  {
    id: "studio",
    name: "Turnkey Studio",
    monthlyPrice: 79,
    annualPrice: 63,
    period: "per month",
    description:
      "Flagship builder & developer suite with priority 1-on-1 custom build quotes, full CAD/MEP schedules, and unlimited Vastu audits.",
    features: [
      "Everything in Architect Pro unlocked across devices",
      "All 3 Kitchen Layouts (L-Island, Galley, U-Chef) in real-time 3D",
      "Priority 1-on-1 construction & casting quote negotiation",
      "Full downloadable architectural MEP, concrete & joinery BOM specs",
      "Unlimited Vastu Shastra & Vedic Rashi pre-purchase house audits",
    ],
    cta: "Activate Turnkey Studio",
  },
];

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  currentTier,
  onSelectTier,
  onReturnToStudio,
}) => {
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-mono text-[#B45309] tracking-wide">
            Spark&amp;Lintel Design-Builders · 3D Material, Casting &amp; Vendor Access
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-semibold text-[#141517] mt-1">
            Unlock Every 3D Design, Custom Wall Color &amp; Direct Vendor Store
          </h1>
          <p className="text-sm sm:text-base text-[#57534E] mt-2 leading-relaxed">
            Subscribe to unlock all 4 architectural plans, custom paint colors
            on any Bedroom, Toilet, Kitchen &amp; exterior wall, all 12 cabinet
            palettes, 3D casting structures, and direct shopping access to
            George Buildings &amp; Sophia Key Designer Furniture.
          </p>
        </div>

        {/* Billing Cadence Switcher */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-black/12 bg-white p-1 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setAnnualBilling(false)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              !annualBilling
                ? "bg-[#141517] text-white"
                : "text-[#57534E] hover:text-[#141517]"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnualBilling(true)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              annualBilling
                ? "bg-[#141517] text-white"
                : "text-[#57534E] hover:text-[#141517]"
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] font-mono text-[#F59E0B]">SAVE 20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8 items-stretch">
        {PLANS.map((plan) => {
          const isActive = currentTier === plan.id;
          const displayPrice =
            plan.monthlyPrice === 0
              ? "$0"
              : `$${annualBilling ? plan.annualPrice : plan.monthlyPrice}`;
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
                      ? "BEST VALUE · MOST POPULAR"
                      : "FULL STUDIO SUITE"}
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
                    {displayPrice}
                  </span>
                  <span
                    className={`text-xs ${
                      plan.highlighted ? "text-white/70" : "text-[#78716C]"
                    }`}
                  >
                    {plan.monthlyPrice === 0
                      ? plan.period
                      : annualBilling
                      ? "per month, billed yearly"
                      : plan.period}
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

      {/* Conversion & Direct Vendor Shield Banner */}
      <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
          <div className="text-xs text-[#57534E] leading-relaxed">
            <p className="font-semibold text-[#141517]">
              Design Free of Construction Price Markups · Direct Vendor Shopping &amp; Global Legal Shield
            </p>
            <p className="mt-0.5">
              Subscriptions cover 3D software, architectural blueprints, custom wall color previews, and partner vendor discovery. Physical furniture orders are placed directly with George Buildings or Sophia Key stores, while construction &amp; casting scopes are negotiated 1-on-1 after you love your 3D build.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

