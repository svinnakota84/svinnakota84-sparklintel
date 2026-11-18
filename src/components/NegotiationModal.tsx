import React, { useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planAreaSqFt: number;
  interiorSummary: string;
  exteriorSummary: string;
  castingSummary?: string;
  vastuFacing: string;
  savedBriefStyles?: string[];
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  isOpen,
  onClose,
  planName,
  planAreaSqFt,
  interiorSummary,
  exteriorSummary,
  castingSummary,
  vastuFacing,
  savedBriefStyles = [],
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const refCode = `SL-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedRef(refCode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-black/10 w-full max-w-lg max-h-[90dvh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-[#B45309]">
              Spark&amp;Lintel Design-Builders · Custom Negotiation
            </p>
            <h2 className="font-display text-xl font-semibold text-[#141517]">
              Request Proposal for Your Custom Build
            </h2>
          </div>
          <button
            onClick={() => {
              setSubmittedRef(null);
              onClose();
            }}
            aria-label="Close modal"
            className="min-h-[40px] min-w-[40px] rounded-lg hover:bg-black/5 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5 text-[#57534E]" />
          </button>
        </div>

        {submittedRef ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-semibold text-[#141517]">
              Design Saved for Negotiation
            </h3>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Your custom configuration for{" "}
              <span className="font-semibold text-[#141517]">{planName}</span>{" "}
              has been logged under reference{" "}
              <span className="font-mono font-semibold text-[#92400E]">
                {submittedRef}
              </span>
              . Our Spark&amp;Lintel Design-Builders engineering &amp; interiors
              team will reach out to{" "}
              <span className="font-medium text-[#141517]">{email}</span> to
              negotiate final scope and timeline.
            </p>
            <button
              onClick={() => {
                setSubmittedRef(null);
                onClose();
              }}
              className="mt-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-[#141517] text-white text-xs font-semibold hover:bg-[#292B2F] transition-colors cursor-pointer"
            >
              Return to Studio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="rounded-xl bg-[#FAF9F6] border border-black/8 p-3.5 text-xs text-[#57534E] space-y-1">
              <p className="font-semibold text-[#141517]">
                Saved Design Package (Pricing Negotiated 1-on-1)
              </p>
              <p>
                Residence: {planName} ({planAreaSqFt.toLocaleString()} sq ft ·{" "}
                {vastuFacing} Facing)
              </p>
              <p>Spark Interior: {interiorSummary}</p>
              <p>Spark Construction: {exteriorSummary}</p>
              {castingSummary && <p>3D Casting: {castingSummary}</p>}
              {savedBriefStyles.length > 0 && (
                <p>Saved Portfolio Styles: {savedBriefStyles.join(", ")}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-[#57534E]">
                  Your Name *
                </span>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-white px-3 text-sm text-[#141517] focus:outline-none focus:border-[#B45309]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#57534E]">
                  Phone / WhatsApp
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 / +91 ..."
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-white px-3 text-sm text-[#141517] focus:outline-none focus:border-[#B45309]"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-[#57534E]">
                Email Address *
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-white px-3 text-sm text-[#141517] focus:outline-none focus:border-[#B45309]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[#57534E]">
                Plot Location &amp; Negotiation Notes
              </span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your plot city, target start date, or preferred custom material adjustments..."
                className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-[#141517] focus:outline-none focus:border-[#B45309]"
              />
            </label>

            <p className="text-[11px] text-[#78716C] leading-relaxed">
              Non-binding quote request: all 3D models, structural casting
              concepts, and finishes are preliminary until locally stamped by a
              licensed PE/architect and finalized by written contract.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-black/15 text-xs font-medium text-[#57534E] hover:text-[#141517] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#B45309] text-white text-xs font-semibold hover:bg-[#92400E] transition-colors cursor-pointer"
              >
                Submit &amp; Negotiate Quote
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
