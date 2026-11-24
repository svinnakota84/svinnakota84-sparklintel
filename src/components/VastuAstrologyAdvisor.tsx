import React, { useMemo, useRef, useState } from "react";
import { Compass, Send, Sparkles, UserCheck } from "lucide-react";
import {
  KITCHEN_ZONES,
  PLOT_FACINGS,
  RASHI_LIST,
} from "../data/catalog";
import {
  AdvisorMessage,
  CabinetColorCombo,
  CabinetMaterialSpec,
  ConstructionPlan,
  KitchenLayoutType,
  SubscriptionTier,
  VastuBuyerProfile,
} from "../types";
import { generateLocalAdvisorReply } from "../utils/advisorFallback";

interface VastuAstrologyAdvisorProps {
  selectedPlan: ConstructionPlan;
  kitchenLayout: KitchenLayoutType;
  activeCombo: CabinetColorCombo;
  upperFinish: CabinetMaterialSpec;
  lowerFinish: CabinetMaterialSpec;
  countertopFinish: CabinetMaterialSpec;
  hardwareFinish: CabinetMaterialSpec;
  subscriptionTier: SubscriptionTier;
  buyerProfile: VastuBuyerProfile;
  onUpdateProfile: (next: VastuBuyerProfile) => void;
}

const STARTER_QUESTIONS = [
  "Is this house facing & South-East kitchen auspicious for my Rashi when buying?",
  "Can Spark&Lintel cast a commercial building or monolithic GFRC villa?",
  "Which cabinet colors and stone match Agneya (SE) Vastu energy in 3D?",
  "What structural column and beam checks should I verify before buying an under-construction villa?",
  "My prospective flat has a North-West or North-East kitchen — what non-structural remedies work?",
];

export const VastuAstrologyAdvisor: React.FC<VastuAstrologyAdvisorProps> = ({
  selectedPlan,
  kitchenLayout,
  activeCombo,
  upperFinish,
  lowerFinish,
  countertopFinish,
  hardwareFinish,
  subscriptionTier,
  buyerProfile,
  onUpdateProfile,
}) => {
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Namaste. I am your Spark&Lintel Design-Builders Principal Architect, Civil Engineer, and Vastu-Jyotish Advisor.\n\nI can inspect your current ${selectedPlan.name} (${selectedPlan.facing}-facing, ${selectedPlan.areaSqFt.toLocaleString()} sq ft) structural blueprint, review your 3D "${activeCombo.name}" kitchen finishes, or evaluate a home you are planning to buy using Indian Vastu Shastra & Vedic Rashi harmony.\n\nAdjust your Homebuyer Vastu & Rashi profile on the left or ask any question below.`,
      timestamp: "Ready",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  // Deterministic live Vastu + Jyotish House-Buying Snapshot
  const vastuCheck = useMemo(() => {
    let score = 72;
    const notes: string[] = [];

    if (
      buyerProfile.plotFacing.startsWith("North") ||
      buyerProfile.plotFacing.startsWith("East")
    ) {
      score += 12;
      notes.push(
        `${buyerProfile.plotFacing} entrance invites morning Surya / Kubera prosperity.`
      );
    } else if (buyerProfile.plotFacing.startsWith("West")) {
      score += 6;
      notes.push("West facing suits Varuna stability; keep NW-W entrance Pada balanced.");
    } else {
      notes.push(
        `${buyerProfile.plotFacing} facing benefits from brass threshold & bright foyer lighting.`
      );
    }

    if (buyerProfile.kitchenZone.includes("South-East")) {
      score += 12;
      notes.push("Agneya (South-East) kitchen aligns ideally with Fire element.");
    } else if (buyerProfile.kitchenZone.includes("North-West")) {
      score += 7;
      notes.push("Vayavya (North-West) kitchen is an approved secondary zone.");
    } else {
      score -= 6;
      notes.push(
        "Non-Agneya kitchen: use warm terracotta/copper accents & keep stove facing East."
      );
    }

    if (buyerProfile.masterBedroomZone.includes("South-West")) {
      score += 4;
      notes.push("Nairutya (South-West) master suite anchors earth stability.");
    }

    const rashiElement = buyerProfile.rashi.split("—")[1]?.trim() ?? "Earth";
    notes.push(
      `Rashi element (${rashiElement}) pairs well with ${upperFinish.name} + ${hardwareFinish.name}.`
    );

    return {
      score: Math.min(99, Math.max(55, score)),
      notes,
    };
  }, [buyerProfile, upperFinish.name, hardwareFinish.name]);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: AdvisorMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    const contextPayload = {
      planName: selectedPlan.name,
      planFacing: selectedPlan.facing,
      planAreaSqFt: selectedPlan.areaSqFt,
      vastuScore: selectedPlan.vastuScore,
      kitchenLayout,
      cabinetPalette: activeCombo.name,
      upperFinish: upperFinish.name,
      lowerFinish: lowerFinish.name,
      countertop: countertopFinish.name,
      hardware: hardwareFinish.name,
      subscriptionTier,
      buyerProfile,
    };

    try {
      if (import.meta.env.VITE_STATIC_ADVISOR === "true") throw new Error("STATIC_MODE");
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: contextPayload,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("STATIC_MODE");
      }

      const data = await response.json();
      if (!response.ok || !data?.reply) {
        throw new Error(data?.error || "STATIC_MODE");
      }

      const aiMsg: AdvisorMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } catch {
      const fallbackReply = generateLocalAdvisorReply(trimmed, contextPayload);
      setErrorMsg(import.meta.env.VITE_STATIC_ADVISOR === "true"
        ? "Studio Help uses built-in guidance."
        : "The AI service is unavailable. Showing built-in Studio Help.");
      const aiMsg: AdvisorMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
      <div className="pb-6 border-b border-black/8">
        <p className="text-xs font-mono text-[#B45309] tracking-wide">
          Civil Engineering · Indian Vastu Shastra · Vedic Jyotish
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#141517] mt-1">
          House-Buying Vastu, Astrology &amp; Engineering Advisor
        </h1>
        <p className="text-sm text-[#57534E] mt-1 max-w-2xl">
          Ask questions about structural safety, kitchen finishes, plot
          direction, Rashi/Nakshatra alignment, and Vastu remedies before buying
          or building your home.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Buyer Kundali & Vastu Profile (Second on Mobile so Chat appears immediately) */}
        <div className="order-2 lg:order-1 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#141517] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#B45309]" />
                <span>Homebuyer Vastu &amp; Rashi Profile</span>
              </h2>
              <span className="font-mono text-xs font-semibold text-[#92400E] tabular-nums">
                {vastuCheck.score}% Fit
              </span>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-[#57534E]">
                  Plot / Main Door Facing
                </span>
                <select
                  value={buyerProfile.plotFacing}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...buyerProfile,
                      plotFacing: e.target.value,
                    })
                  }
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-[#FAF9F6] px-3 text-xs text-[#141517] focus:outline-none focus:border-[#B45309]"
                >
                  {PLOT_FACINGS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#57534E]">
                  Kitchen Zone
                </span>
                <select
                  value={buyerProfile.kitchenZone}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...buyerProfile,
                      kitchenZone: e.target.value,
                    })
                  }
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-[#FAF9F6] px-3 text-xs text-[#141517] focus:outline-none focus:border-[#B45309]"
                >
                  {KITCHEN_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#57534E]">
                  Buyer Rashi (Moon Sign)
                </span>
                <select
                  value={buyerProfile.rashi}
                  onChange={(e) =>
                    onUpdateProfile({ ...buyerProfile, rashi: e.target.value })
                  }
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-[#FAF9F6] px-3 text-xs text-[#141517] focus:outline-none focus:border-[#B45309]"
                >
                  {RASHI_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block">
                  <span className="text-xs font-medium text-[#57534E]">
                    Nakshatra (Optional)
                  </span>
                  <input
                    type="text"
                    value={buyerProfile.nakshatra}
                    onChange={(e) =>
                      onUpdateProfile({
                        ...buyerProfile,
                        nakshatra: e.target.value,
                      })
                    }
                    placeholder="e.g. Rohini"
                    className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-[#FAF9F6] px-3 text-xs text-[#141517] focus:outline-none focus:border-[#B45309]"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#57534E]">
                    City / Climate
                  </span>
                  <input
                    type="text"
                    value={buyerProfile.cityOrClimate}
                    onChange={(e) =>
                      onUpdateProfile({
                        ...buyerProfile,
                        cityOrClimate: e.target.value,
                      })
                    }
                    placeholder="e.g. Bengaluru"
                    className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-[#FAF9F6] px-3 text-xs text-[#141517] focus:outline-none focus:border-[#B45309]"
                  />
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-black/8">
              <p className="text-xs font-semibold text-[#141517] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Instant Vastu &amp; Jyotish Readout</span>
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-[#57534E] leading-relaxed">
                {vastuCheck.notes.map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span className="text-[#B45309] font-mono">·</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Active Context Summary */}
          <div className="bg-white rounded-2xl border border-black/8 p-4 text-xs text-[#57534E] space-y-1">
            <p className="font-semibold text-[#141517]">
              Synced Studio Context
            </p>
            <p>
              Plan: <span className="text-[#141517]">{selectedPlan.name}</span>
            </p>
            <p>
              3D Kitchen:{" "}
              <span className="text-[#141517]">{activeCombo.name}</span>
            </p>
            <p>
              Stone:{" "}
              <span className="text-[#141517]">{countertopFinish.name}</span>
            </p>
          </div>
        </div>

        {/* Interactive Gemini Advisor (First on Mobile) */}
        <div className="order-1 lg:order-2 lg:col-span-8 bg-white rounded-2xl border border-black/8 flex flex-col h-[480px] sm:h-[640px] overflow-hidden">
          {/* Quick Prompts */}
          <div className="px-4 py-3 border-b border-black/8 bg-[#FAF9F6]">
            <p className="text-[11px] font-medium text-[#78716C] mb-2">
              Popular Homebuyer &amp; Design Consultations
            </p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuestion(q)}
                  disabled={isLoading}
                  className="shrink-0 min-h-[36px] px-3 py-1.5 rounded-lg border border-black/10 bg-white text-xs text-[#141517] hover:border-[#B45309] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#141517] text-white"
                      : "bg-[#F8F7F4] text-[#141517] border border-black/8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[11px] opacity-70">
                    <span className="font-medium flex items-center gap-1">
                      {msg.role === "assistant" && (
                        <Sparkles className="w-3 h-3 text-[#B45309]" />
                      )}
                      {msg.role === "user" ? "You" : "Spark&Lintel Vastu & Civil Advisor"}
                    </span>
                    <span className="font-mono tabular-nums">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div>{msg.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 text-xs text-[#57534E] bg-[#F8F7F4] border border-black/8">
                  Analyzing structural plan, 3D finishes, and Vastu-Jyotish alignment...
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl p-3.5 bg-red-50 border border-red-200 text-xs text-red-800">
                {errorMsg}
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="p-3 sm:p-4 border-t border-black/8 bg-white flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about buying a house, Vastu facing, Rashi compatibility, or 3D cabinets..."
              className="flex-1 min-h-[44px] rounded-xl border border-black/15 bg-[#FAF9F6] px-4 text-sm text-[#141517] placeholder:text-[#78716C] focus:outline-none focus:border-[#B45309]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send question"
              className="min-h-[44px] min-w-[44px] px-4 rounded-xl bg-[#B45309] text-white font-medium text-xs hover:bg-[#92400E] disabled:opacity-45 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask Advisor</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
