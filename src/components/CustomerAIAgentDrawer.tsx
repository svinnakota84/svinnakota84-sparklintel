import React, { useRef, useState } from "react";
import { ArrowUpRight, MessageSquare, Send, Sparkles, X } from "lucide-react";
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

interface CustomerAIAgentDrawerProps {
  hidden?: boolean;
  selectedPlan: ConstructionPlan;
  kitchenLayout: KitchenLayoutType;
  activeCombo: CabinetColorCombo;
  upperFinish: CabinetMaterialSpec;
  lowerFinish: CabinetMaterialSpec;
  countertopFinish: CabinetMaterialSpec;
  hardwareFinish: CabinetMaterialSpec;
  castingContext: {
    sector: string;
    methodName: string;
    floors: number;
    bays: number;
    concreteFinish: string;
  };
  subscriptionTier: SubscriptionTier;
  buyerProfile: VastuBuyerProfile;
  onOpenFullAdvisor: () => void;
}

const isStaticAdvisor = import.meta.env.VITE_STATIC_ADVISOR === "true";

const QUICK_CUSTOMER_PROMPTS = [
  "How do I add Sophia Key furniture to my room?",
  "Where can I find architecture inspiration?",
  "How do custom quotes & subscriptions work?",
  "How can I use REEKON measurements in the studio?",
];

export const CustomerAIAgentDrawer: React.FC<CustomerAIAgentDrawerProps> = ({
  hidden = false,
  selectedPlan,
  kitchenLayout,
  activeCombo,
  upperFinish,
  lowerFinish,
  countertopFinish,
  hardwareFinish,
  castingContext,
  subscriptionTier,
  buyerProfile,
  onOpenFullAdvisor,
}) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      id: "agent-welcome",
      role: "assistant",
      content:
        "Ask about your house plan, kitchen finishes, vendor furniture, casting, design inspiration, Vastu or subscriptions.",
      timestamp: "Live",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  if (hidden) return null;

  const sendQuestion = async (text: string) => {
    const trimmed = text.trim();
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
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 40);

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
      castingSummary: `${castingContext.sector} · ${castingContext.methodName} (${castingContext.floors}F × ${castingContext.bays} Bays, ${castingContext.concreteFinish})`,
      subscriptionTier,
      buyerProfile,
    };

    try {
      if (isStaticAdvisor) throw new Error("STATIC_MODE");
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

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } catch {
      const fallbackReply = generateLocalAdvisorReply(trimmed, contextPayload);
      setErrorMsg(isStaticAdvisor
        ? "Studio Help uses built-in guidance."
        : "The AI service is unavailable. Showing built-in Studio Help.");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Persistent Floating AI Customer Agent Trigger (Always Visible) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={isStaticAdvisor ? "Open Studio Help" : "Ask Spark&Lintel AI Agent"}
          className="fixed bottom-[68px] right-3 sm:bottom-6 sm:right-6 z-30 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#141517] text-white text-xs font-semibold shadow-xl border border-white/15 hover:bg-[#292B2F] transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span>{isStaticAdvisor ? "Studio Help" : "Ask AI Agent"}</span>
        </button>
      )}

      {/* Slide-Over AI Agent Q&A Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={isStaticAdvisor ? "Spark&Lintel Studio Help" : "Spark&Lintel AI Customer Agent"}
          className="fixed bottom-[64px] right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[410px] h-[72dvh] sm:h-[560px] z-50 bg-white rounded-2xl border border-black/15 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="px-4 py-3 bg-[#141517] text-white flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <p className="text-[11px] font-mono text-[#F59E0B] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{isStaticAdvisor ? "SparkLintel Studio Help" : "Spark&Lintel Customer AI Agent"}</span>
              </p>
              <p className="text-xs font-semibold truncate">
                Interiors · Casting · Vastu &amp; Quotes
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenFullAdvisor();
                }}
                title="Open full Vastu & Profile workspace"
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Full Vastu</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close AI Agent"
                className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Customer Questions */}
          <div className="px-3 py-2 border-b border-black/8 bg-[#FAF9F6] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_CUSTOMER_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => sendQuestion(q)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1.5 rounded-lg border border-black/10 bg-white text-[11px] font-medium text-[#141517] hover:border-[#B45309] transition-colors whitespace-nowrap cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#F8F7F4]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#141517] text-white"
                      : "bg-white text-[#141517] border border-black/8"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3.5 py-2.5 text-xs text-[#57534E] bg-white border border-black/8">
                  Thinking about your 3D design, casting &amp; Vastu question...
                </div>
              </div>
            )}
            {errorMsg && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200 text-xs text-red-800">
                {errorMsg}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="p-2.5 border-t border-black/8 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any customer question..."
              className="flex-1 min-h-[42px] rounded-xl border border-black/15 bg-[#FAF9F6] px-3.5 text-sm text-[#141517] placeholder:text-[#78716C] focus:outline-none focus:border-[#B45309]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send customer question"
              className="min-h-[42px] min-w-[42px] rounded-xl bg-[#B45309] text-white hover:bg-[#92400E] disabled:opacity-45 flex items-center justify-center cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
