import React, { useState } from "react";
import { Scale, ShieldCheck, X } from "lucide-react";

export type LegalSectionId =
  | "engineering"
  | "vastu"
  | "privacy"
  | "terms"
  | "global"
  | "vendors";

export function VendorTerms() {
  return <div className="space-y-3 text-sm leading-relaxed">
    <p><strong>Furniture purchases are made directly with the vendor.</strong> Spark&amp;Lintel, operated by Radiant Spark LLC, provides design tools and links to independent businesses. For purchases made directly with a vendor, the business identified on your order or invoice is your seller. That seller sets prices, availability, payment, delivery, warranty, return and refund terms.</p>
    <p><strong>For damage, defects or missing items, contact your seller.</strong> Keep your order number, photos of the item and packaging, and proof of delivery. Follow the seller’s claim deadlines and contact the carrier if the seller directs you to. Ask the seller about freight, duties, return costs and warranty coverage before paying.</p>
    <p>For direct vendor purchases, Radiant Spark LLC does not collect the order payment, ship the goods, issue vendor refunds, or provide the vendor’s warranty. To the extent permitted by applicable law, Radiant Spark LLC is not responsible for a vendor’s goods, delivery, or performance of its order. This notice leaves intact mandatory consumer rights and any obligations Radiant Spark LLC independently assumes under a separate signed agreement.</p>
  </div>;
}

interface LegalShieldModalProps {
  isOpen: boolean;
  initialSection?: LegalSectionId;
  onClose: () => void;
}

export const LegalShieldModal: React.FC<LegalShieldModalProps> = ({
  isOpen,
  initialSection = "engineering",
  onClose,
}) => {
  const [section, setSection] = useState<LegalSectionId>(initialSection);

  React.useEffect(() => {
    if (isOpen) {
      setSection(initialSection);
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-black/10 w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#B45309] shrink-0" />
            <div>
              <p className="text-[11px] font-mono text-[#B45309]">
                Spark&amp;Lintel Design-Builders · Global Legal Shield
              </p>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-[#141517]">
                Disclaimers, Terms &amp; International Compliance
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close legal disclosures"
            className="min-h-[40px] min-w-[40px] rounded-lg hover:bg-black/5 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5 text-[#57534E]" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-black/8 bg-[#FAF9F6] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {(
            [
              { id: "engineering", label: "Engineering & Casting" },
              { id: "vastu", label: "Vastu & Astrology" },
              { id: "privacy", label: "Global Privacy" },
              { id: "terms", label: "Quotes & Subscriptions" },
              { id: "vendors", label: "Vendor Orders & Claims" },
              { id: "global", label: "Applicable Rights" },
            ] as { id: LegalSectionId; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                section === tab.id
                  ? "bg-[#141517] text-white"
                  : "text-[#57534E] hover:text-[#141517] hover:bg-black/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#57534E] leading-relaxed">
          {section === "engineering" && (
            <>
              <h3 className="font-display text-lg font-semibold text-[#141517]">
                1. Conceptual 3D Plans, Casting &amp; Local Engineering Stamping
              </h3>
              <p>
                All 3D kitchen models, residential floor plans, structural
                casting concepts (monolithic RCC, precast panels, GFRC arches,
                post-tensioned slabs, waffle slabs, and commercial frames), and
                CAD layers displayed on Spark&amp;Lintel Design-Builders are{" "}
                <strong className="text-[#141517]">
                  preliminary architectural visualization and design-planning
                  concepts only
                </strong>
                .
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  No 3D preview or downloadable specification sheet constitutes
                  a stamped &ldquo;Issued for Construction&rdquo; (IFC) drawing.
                </li>
                <li>
                  Before excavation, casting, concrete pouring, or renovation,
                  final structural calculations, soil geotechnical testing
                  (SBC), wind/seismic detailing, and MEP drawings must be
                  reviewed, stamped, and permitted by a{" "}
                  <strong className="text-[#141517]">
                    licensed Professional Engineer (PE) or Registered Architect
                  </strong>{" "}
                  authorized in your municipality, state, or country.
                </li>
                <li>
                  Compliance with regional codes (such as IBC/IRC/ACI in the
                  USA, IS Codes / NBC in India, Eurocodes in the EU, BS/UK
                  Building Regulations, AS/NZS, or local GCC/UAE municipal
                  rules) is governed strictly by your executed construction
                  contract.
                </li>
              </ul>
            </>
          )}

          {section === "vastu" && (
            <>
              <h3 className="font-display text-lg font-semibold text-[#141517]">
                2. Indian Vastu Shastra &amp; Vedic Astrology (Jyotish) Notice
              </h3>
              <p>
                The Vastu &amp; Astrology AI advisor provides cultural,
                traditional architectural-planning, and spiritual-harmony
                perspectives based on Vastu Shastra and Jyotish principles.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Guidance is provided strictly for{" "}
                  <strong className="text-[#141517]">
                    informational and cultural design-planning purposes
                  </strong>{" "}
                  and does not constitute financial, legal, real-estate
                  investment, medical, or structural safety advice.
                </li>
                <li>
                  Vastu remedies or color suggestions must never override local
                  fire-egress codes, structural load-bearing rules, ventilation
                  requirements, or municipal zoning laws.
                </li>
              </ul>
            </>
          )}

          {section === "privacy" && (
            <>
              <h3 className="font-display text-lg font-semibold text-[#141517]">
                3. Cross-Border Data Privacy (GDPR, UK GDPR, CCPA/CPRA, India DPDP)
              </h3>
              <p>
                Spark&amp;Lintel Design-Builders respects international data
                protection laws for visitors and clients worldwide:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#141517]">Data Minimization:</strong>{" "}
                  Subscription preference state is stored locally in your
                  browser. Negotiation inquiries and Vastu/construction
                  questions are transmitted only when you explicitly submit them.
                </li>
                <li>
                  <strong className="text-[#141517]">
                    AI Processing Transparency:
                  </strong>{" "}
                  Questions sent to the Vastu &amp; Engineering AI advisor are
                  processed via server-side API calls without exposing secrets
                  in the browser. Avoid submitting sensitive government IDs,
                  tax numbers, or payment card numbers in chat messages.
                </li>
                <li>
                  <strong className="text-[#141517]">Your Rights:</strong> Under
                  EU/UK GDPR, California CCPA/CPRA, and India&apos;s Digital
                  Personal Data Protection Act (DPDP), you may request access,
                  correction, or deletion of any project inquiry you submit.
                </li>
              </ul>
            </>
          )}

          {section === "terms" && (
            <>
              <h3 className="font-display text-lg font-semibold text-[#141517]">
                4. Custom Price Negotiation, Subscriptions &amp; Material Sourcing
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#141517]">
                    No Binding Offer on Site:
                  </strong>{" "}
                  Submitting a design configuration for negotiation is a{" "}
                  <strong className="text-[#141517]">
                    non-binding request for quotation (RFQ)
                  </strong>
                  . Final pricing, timelines, casting schedules, and delivery
                  terms apply only after a mutually signed master design-build
                  or supply agreement.
                </li>
                <li>
                  <strong className="text-[#141517]">
                    3D Studio Subscriptions:
                  </strong>{" "}
                  Starter, Architect Pro, and Turnkey Studio tiers cover software
                  visualization access, 3D color/material combinations, and
                  preliminary spec exports—separate from physical construction
                  or furniture procurement fees.
                </li>
                <li>
                  <strong className="text-[#141517]">
                    Material &amp; Finish Variance:
                  </strong>{" "}
                  Digital 3D wood grains, natural travertine/marble veining,
                  precast concrete tones, and fabrics are realistic visual
                  approximations; physical samples must be approved prior to
                  fabrication or casting.
                </li>
              </ul>
            </>
          )}

          {section === "vendors" && <section className="space-y-3">
            <h3 className="font-display text-lg font-semibold text-[#141517]">Vendor Orders, Delivery &amp; Claims</h3>
            <VendorTerms />
          </section>}

          {section === "global" && (
            <>
              <h3 className="font-display text-lg font-semibold text-[#141517]">
                Applicable Rights and Project Agreements
              </h3>
              <p>Applicable consumer and construction laws govern each transaction. Direct vendor orders follow the seller’s terms and applicable law. Separate design-build or supply work follows the signed project agreement.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[#141517]">
                    Limited Liability Entity &amp; Insurance:
                  </strong>{" "}
                  Operate through an LLC/Corporation with{" "}
                  <em>Errors &amp; Omissions (E&amp;O)</em> / Professional
                  Indemnity and General Liability coverage extending to target
                  export regions.
                </li>
                <li>
                  <strong className="text-[#141517]">
                    Local Licensed Partner Sign-Off:
                  </strong>{" "}
                  Always require a licensed engineer/architect in the
                  project&apos;s country/state to stamp construction &amp;
                  casting drawings before site work begins.
                </li>
                <li>
                  <strong className="text-[#141517]">
                    Governing Law &amp; Arbitration Clause:
                  </strong>{" "}
                  State a clear governing jurisdiction and international
                  arbitration forum (e.g., ICC / SIAC / AAA) inside your signed
                  client contracts, subject to local mandatory consumer laws.
                </li>
                <li>
                  <strong className="text-[#141517]">
                    International Trade &amp; Incoterms:
                  </strong>{" "}
                  When sourcing cabinetry, glazing, or designer furniture across
                  borders, define Incoterms (FOB, CIF, DDP), customs duties,
                  wood-fumigation rules, and local electrical/UL/CE/BIS
                  certifications clearly in writing.
                </li>
              </ul>
              <p className="text-xs text-[#78716C] pt-2 border-t border-black/8 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                <span>
                  Note: This compliance framework is educational guidance—have a
                  qualified corporate/construction attorney review your final
                  client contracts for your home jurisdiction.
                </span>
              </p>
            </>
          )}
        </div>

        {/* Footer Action */}
        <div className="px-6 py-3.5 border-t border-black/8 bg-[#FAF9F6] flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#78716C]">
            Spark&amp;Lintel Design-Builders · Global Compliance Notice
          </span>
          <button
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[#141517] text-white text-xs font-semibold hover:bg-[#292B2F] transition-colors cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
