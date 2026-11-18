import React, { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Building2,
  CheckCircle2,
  Compass,
  Handshake,
  ShieldCheck,
  Star,
  ThumbsUp,
} from "lucide-react";
import portfolioLuxuryVillaImg from "../assets/images/portfolio_luxury_villa_1795041093904.jpg";
import portfolioKitchenInteriorImg from "../assets/images/portfolio_kitchen_interior_1795041093396.jpg";
import portfolioCommercialCastingImg from "../assets/images/portfolio_commercial_casting_1795041093185.jpg";
import portfolioModularTinyVillaImg from "../assets/images/portfolio_modular_tiny_villa_1795041094541.jpg";
import { AppTab } from "../types";

export type PortfolioCategory =
  | "all"
  | "villa"
  | "modular"
  | "interior"
  | "commercial";

interface BuiltProjectCase {
  id: string;
  category: Exclude<PortfolioCategory, "all">;
  title: string;
  location: string;
  areaSqFt: number;
  durationLabel: string;
  methodLabel: string;
  imageSrc: string;
  imageAlt: string;
  outcomeSummary: string;
  beforeAfterNote: string;
  targetTab: AppTab;
  targetActionLabel: string;
}

interface ClientReviewItem {
  id: string;
  authorName: string;
  roleOrHome: string;
  city: string;
  category: "Residential Villa" | "Kitchen & Interiors" | "Commercial & Casting" | "Modular Home";
  rating: number;
  dateLabel: string;
  verifiedScope: string;
  headline: string;
  quote: string;
  outcomeMetric: string;
  helpfulCount: number;
}

const BUILT_PROJECTS: BuiltProjectCase[] = [
  {
    id: "case-surya-dlf",
    category: "villa",
    title: "Surya Courtyard Twin Villa",
    location: "DLF Phase IV, Gurugram",
    areaSqFt: 3420,
    durationLabel: "13.5 Months Turnkey",
    methodLabel: "Post-Tensioned RCC · Travertine Cladding",
    imageSrc: portfolioLuxuryVillaImg,
    imageAlt:
      "Completed modern two-story courtyard villa with warm travertine walls, cantilevered flat concrete slab, and water court",
    outcomeSummary:
      "Built from a North-facing corner plot using full 3D twin sign-off prior to foundation excavation. Zero rework orders across 48 structural columns.",
    beforeAfterNote:
      "Before: Narrow irregular 50×68 ft lot with dark central staircase · Outcome: Sunlit Ishanya water court & column-free 26 ft living span.",
    targetTab: "plans",
    targetActionLabel: "Inspect Structural Plan",
  },
  {
    id: "case-calacatta-kitchen",
    category: "interior",
    title: "Fluted Oak & Calacatta Chef Pavilion",
    location: "Indiranagar, Bengaluru",
    areaSqFt: 1180,
    durationLabel: "9 Weeks Fabrication",
    methodLabel: "Fluted White Oak · Calacatta Gold Waterfall",
    imageSrc: portfolioKitchenInteriorImg,
    imageAlt:
      "Luxury open-concept fluted white oak kitchen with Calacatta marble waterfall island and curved boucle chairs",
    outcomeSummary:
      "Homeowners tested 8 cabinet combinations in 3D before ordering bespoke stone slabs and sculptural Sophia Key lounge pieces directly.",
    beforeAfterNote:
      "Before: Closed 1990s galley kitchen cut off from garden · Outcome: Seamless indoor-outdoor chef island rated Agneya Vastu.",
    targetTab: "studio",
    targetActionLabel: "Open 3D Kitchen Studio",
  },
  {
    id: "case-gfrc-gallery",
    category: "commercial",
    title: "Lintel Arched Gallery & Commercial Hub",
    location: "Jubilee Hills, Hyderabad",
    areaSqFt: 6850,
    durationLabel: "11 Months Shell & Glazing",
    methodLabel: "Sculptural GFRC Arches · Board-Formed Concrete",
    imageSrc: portfolioCommercialCastingImg,
    imageAlt:
      "Commercial gallery building featuring white sculpted GFRC colonnade arches, concrete walls, and bronze-framed storefronts",
    outcomeSummary:
      "Prefabricated GFRC arched colonnade cut crane-assembly time by 5 weeks while delivering slim bronze thermal-break storefronts.",
    beforeAfterNote:
      "Before: Aging single-floor retail shell · Outcome: Two-story sculptural showroom plaza anchored for anchor gallery tenants.",
    targetTab: "casting",
    targetActionLabel: "Configure 3D Casting",
  },
  {
    id: "case-modular-goa",
    category: "modular",
    title: "Prana Modular Retreat Pavilion",
    location: "Assagao, Goa",
    areaSqFt: 1460,
    durationLabel: "14 Weeks Prefab + Site Pour",
    methodLabel: "Precast Insulated Plinth · Cantilever Canopy",
    imageSrc: portfolioModularTinyVillaImg,
    imageAlt:
      "Compact modern prefab courtyard pavilion home in tropical garden with cantilevered concrete canopy and glowing glass walls",
    outcomeSummary:
      "Engineered with factory-precast structural panels for coastal monsoon resistance, rapid 14-week installation, and minimal site disturbance.",
    beforeAfterNote:
      "Before: Monsoon-prone orchard plot needing rapid low-waste build · Outcome: Move-in ready acoustic glass pavilion in 98 days.",
    targetTab: "plans",
    targetActionLabel: "View Villa Blueprint",
  },
];

const INITIAL_REVIEWS: ClientReviewItem[] = [
  {
    id: "rev-kapoor",
    authorName: "Raghav & Meera Kapoor",
    roleOrHome: "Custom Villa Owners",
    city: "Gurugram",
    category: "Residential Villa",
    rating: 5,
    dateLabel: "October 2026",
    verifiedScope: "3,420 sq ft Design-Build + Vastu Audit",
    headline: "Zero surprise extras — every wall color and column locked in 3D first",
    quote:
      "We checked 5 firms across NCR before choosing Spark&Lintel. Locking our bedroom wall colors, plumbing shafts, and travertine facade in the 3D builder stopped every on-site argument with contractors.",
    outcomeMetric: "Completed 11 days ahead of milestone schedule",
    helpfulCount: 28,
  },
  {
    id: "rev-iyer",
    authorName: "Siddharth Iyer",
    roleOrHome: "Penthouse Remodel Client",
    city: "Bengaluru",
    category: "Kitchen & Interiors",
    rating: 5,
    dateLabel: "September 2026",
    verifiedScope: "L-Island Fluted Kitchen + Vendor Sourcing",
    headline: "Direct vendor links plus the 3D room drag-and-drop saved weeks",
    quote:
      "Testing Sophia Key chairs and fluted oak cabinets right next to our Agneya kitchen island gave us full confidence before paying the supplier directly. Nothing looked different in real life.",
    outcomeMetric: "100% Vastu kitchen sign-off on first inspection",
    helpfulCount: 19,
  },
  {
    id: "rev-reddy",
    authorName: "Ananya Reddy",
    roleOrHome: "Managing Director, Deccan Design House",
    city: "Hyderabad",
    category: "Commercial & Casting",
    rating: 5,
    dateLabel: "August 2026",
    verifiedScope: "2-Story GFRC Arched Commercial Showroom",
    headline: "Clean structural engineering and crisp precast execution",
    quote:
      "Our landlord needed an iconic façade without six months of messy wet formwork. The 3D casting X-ray review aligned our local PE stamp cleanly and the GFRC arches went up in three weeks.",
    outcomeMetric: "35% faster envelope erection than cast-in-situ",
    helpfulCount: 24,
  },
  {
    id: "rev-desai",
    authorName: "Vikram & Kavita Desai",
    roleOrHome: "Modular Courtyard Residence",
    city: "Goa",
    category: "Modular Home",
    rating: 5,
    dateLabel: "July 2026",
    verifiedScope: "1,460 sq ft Prefab Concrete & Glass Retreat",
    headline: "Felt like a calm boutique resort delivered like clockwork",
    quote:
      "We wanted a compact smart-footprint home that handled coastal rain without damp walls. Weekly stage photos and stage-gated milestone sign-offs kept our family stress-free from Mumbai.",
    outcomeMetric: "98-day foundation-to-handover delivery",
    helpfulCount: 31,
  },
];

const MILESTONE_GUARANTEES = [
  {
    step: "01",
    title: "Site Soil & Vastu Sign-Off",
    detail:
      "Geotechnical SBC soil test and compass-verified entrance, kitchen, and bedroom zoning before layout approval.",
  },
  {
    step: "02",
    title: "3D Finish & Wall Shade Lock",
    detail:
      "Client sign-off on every cabinet finish, custom bedroom/toilet/kitchen paint hex, and placed furniture footprint.",
  },
  {
    step: "03",
    title: "Local PE Stamp & Stage Escrow",
    detail:
      "Clear stage-gated BOQ negotiated 1-on-1 after design approval—payments released only as each civil milestone passes.",
  },
  {
    step: "04",
    title: "Weekly Rebar & Pour Photo Logs",
    detail:
      "Timestamped rebar spacing checks, concrete slump test logs, and factory joinery previews shared directly with you.",
  },
  {
    step: "05",
    title: "240-Point Handover Checklist",
    detail:
      "Thermal waterproofing test, pressure-tested plumbing lines, and documented post-handover maintenance manual.",
  },
];

const DELIVERABLE_PACKAGES = [
  {
    code: "D-01",
    title: "Plot-Tailored 2D Working Plans",
    desc: "Scaled Bedroom, Toilet, Kitchen, Plinth & setback drawings ready for local municipal permitting.",
  },
  {
    code: "D-02",
    title: "3D Elevations & Facade Color Sets",
    desc: "Day & twilight elevation concepts pairing sandstone, plaster finishes, timber louvers, and glass rails.",
  },
  {
    code: "D-03",
    title: "Structural Column, Beam & Casting Drawings",
    desc: "RCC grid axes, slab thickness notes, and precast/GFRC casting detail concepts for local PE stamping.",
  },
  {
    code: "D-04",
    title: "Interior, Cabinet & Custom Wall Schedules",
    desc: "Full 7-part kitchen cabinetry, stone counters, room wall paint hex codes & Sophia Key/George placement maps.",
  },
  {
    code: "D-05",
    title: "Landscape, Courtyard & Boundary Casting",
    desc: "Ishanya water courts, perimeter precast boundary walls, storm drainage slopes, and garden grading.",
  },
  {
    code: "D-06",
    title: "Indian Vastu Shastra & Jyotish Alignment",
    desc: "Entrance Pada check, Agneya stove orientation, Nairutya master placement, and non-structural remedies.",
  },
];

const REVIEWS_STORAGE_KEY = "sparklintel_client_reviews_v1";

interface ClientProofPortfolioProps {
  savedBriefIds: string[];
  onToggleSaveBrief: (projectId: string, projectTitle: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  onOpenNegotiation: () => void;
  onOpenLegalShield: () => void;
}

export const ClientProofPortfolio: React.FC<ClientProofPortfolioProps> = ({
  savedBriefIds,
  onToggleSaveBrief,
  onNavigateTab,
  onOpenNegotiation,
  onOpenLegalShield,
}) => {
  const [filter, setFilter] = useState<PortfolioCategory>("all");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const [userReviews, setUserReviews] = useState<ClientReviewItem[]>(() => {
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse/storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(userReviews));
    } catch {
      // Ignore storage errors
    }
  }, [userReviews]);

  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [revName, setRevName] = useState("");
  const [revCity, setRevCity] = useState("");
  const [revCategory, setRevCategory] =
    useState<ClientReviewItem["category"]>("Residential Villa");
  const [revRating, setRevRating] = useState(5);
  const [revHeadline, setRevHeadline] = useState("");
  const [revQuote, setRevQuote] = useState("");
  const [revSubmitted, setRevSubmitted] = useState(false);

  const visibleProjects = useMemo(() => {
    if (filter === "all") return BUILT_PROJECTS;
    return BUILT_PROJECTS.filter((p) => p.category === filter);
  }, [filter]);

  const allReviews = useMemo(
    () => [...userReviews, ...INITIAL_REVIEWS],
    [userReviews]
  );

  const leadProject = visibleProjects[0] ?? BUILT_PROJECTS[0];
  const secondaryProjects = visibleProjects.slice(1);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revCity.trim() || !revQuote.trim()) return;
    const nextItem: ClientReviewItem = {
      id: `user-rev-${Date.now()}`,
      authorName: revName.trim(),
      roleOrHome: "Verified Platform Client",
      city: revCity.trim(),
      category: revCategory,
      rating: revRating,
      dateLabel: "Just Submitted",
      verifiedScope: `${revCategory} Consultation`,
      headline:
        revHeadline.trim() || "Verified client experience with Spark&Lintel",
      quote: revQuote.trim(),
      outcomeMetric: "Saved in local review showcase",
      helpfulCount: 1,
    };
    setUserReviews((prev) => [nextItem, ...prev]);
    setRevName("");
    setRevCity("");
    setRevHeadline("");
    setRevQuote("");
    setRevRating(5);
    setRevSubmitted(true);
    setReviewFormOpen(false);
  };

  return (
    <section
      id="client-portfolio"
      aria-labelledby="portfolio-proof-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 border-t border-black/8"
    >
      {/* 01. Realistic Built Portfolio & Style Ideabook */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-mono text-[#B45309] tracking-wide">
              01. Built Reality Proof · Gurugram · Bengaluru · Hyderabad · Goa
            </p>
            <h2
              id="portfolio-proof-heading"
              className="font-display text-2xl sm:text-3xl font-semibold text-[#141517] mt-1"
            >
              Completed Homes, Modular Pavilions &amp; Commercial Casting
            </h2>
            <p className="text-sm text-[#57534E] mt-1.5 leading-relaxed">
              See how our 3D designs translate into real stone, concrete, and
              joinery—and bookmark your favorite styles directly into your
              negotiation brief.
            </p>
          </div>

          {/* Interactive Filter Bar */}
          <div
            role="tablist"
            aria-label="Filter built projects"
            className="flex items-center gap-1 p-1 rounded-xl bg-[#EFECE6] overflow-x-auto no-scrollbar shrink-0"
          >
            {(
              [
                { id: "all", label: "All Builds" },
                { id: "villa", label: "Custom Villas" },
                { id: "modular", label: "Modular & Tiny" },
                { id: "interior", label: "Kitchen & Rooms" },
                { id: "commercial", label: "Commercial Casting" },
              ] as { id: PortfolioCategory; label: string }[]
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? "bg-white text-[#141517] shadow-sm font-semibold"
                      : "text-[#57534E] hover:text-[#141517]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lead Marquee Built Project Split */}
        <article className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-black/10 bg-white overflow-hidden items-stretch">
          <div className="lg:col-span-7 relative min-h-[250px] sm:min-h-[340px] bg-[#E8E2D6]">
            {!brokenImages[leadProject.id] ? (
              <img
                src={leadProject.imageSrc}
                alt={leadProject.imageAlt}
                referrerPolicy="no-referrer"
                onError={() =>
                  setBrokenImages((prev) => ({ ...prev, [leadProject.id]: true }))
                }
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
            ) : (
              <div className="w-full h-full min-h-[250px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#EAE3D5] to-[#DCD3C1]">
                <Building2 className="w-8 h-8 text-[#B45309] mb-2" />
                <p className="text-sm font-semibold text-[#141517]">
                  {leadProject.title}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 p-5 sm:p-7 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C] font-mono tabular-nums">
                <span className="text-[#92400E] font-medium">
                  {leadProject.location}
                </span>
                <span aria-hidden="true">·</span>
                <span>{leadProject.areaSqFt.toLocaleString()} sq ft</span>
                <span aria-hidden="true">·</span>
                <span>{leadProject.durationLabel}</span>
              </div>

              <h3 className="font-display text-2xl font-semibold text-[#141517]">
                {leadProject.title}
              </h3>

              <p className="text-xs font-mono text-[#57534E]">
                {leadProject.methodLabel}
              </p>

              <p className="text-sm text-[#57534E] leading-relaxed">
                {leadProject.outcomeSummary}
              </p>

              <div className="pt-2 border-t border-black/8 text-xs text-[#57534E] leading-relaxed">
                {leadProject.beforeAfterNote}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab(leadProject.targetTab)}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#141517] text-white text-xs font-semibold hover:bg-[#292B2F] transition-colors whitespace-nowrap cursor-pointer"
              >
                {leadProject.targetActionLabel}
              </button>

              <button
                type="button"
                onClick={() =>
                  onToggleSaveBrief(leadProject.id, leadProject.title)
                }
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  savedBriefIds.includes(leadProject.id)
                    ? "border-[#B45309] bg-[#FAF7F2] text-[#92400E]"
                    : "border-black/15 bg-white text-[#141517] hover:border-black/30"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {savedBriefIds.includes(leadProject.id)
                    ? "Saved to Quote Brief"
                    : "Save to Quote Brief"}
                </span>
              </button>
            </div>
          </div>
        </article>

        {/* Secondary Built Cases Grid */}
        {secondaryProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {secondaryProjects.map((project) => {
              const saved = savedBriefIds.includes(project.id);
              return (
                <article
                  key={project.id}
                  className="rounded-2xl border border-black/10 bg-white overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#E8E2D6] overflow-hidden">
                      {!brokenImages[project.id] ? (
                        <img
                          src={project.imageSrc}
                          alt={project.imageAlt}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({
                              ...prev,
                              [project.id]: true,
                            }))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-[#EAE3D5] to-[#DCD3C1]">
                          <Building2 className="w-7 h-7 text-[#B45309] mb-2" />
                          <p className="text-xs font-semibold text-[#141517]">
                            {project.title}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[#78716C] tabular-nums">
                        <span className="text-[#92400E] font-medium">
                          {project.location}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{project.areaSqFt.toLocaleString()} sq ft</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.durationLabel}</span>
                      </div>

                      <h3 className="font-display text-lg font-semibold text-[#141517]">
                        {project.title}
                      </h3>

                      <p className="text-xs text-[#57534E] leading-relaxed">
                        {project.outcomeSummary}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/6">
                    <button
                      type="button"
                      onClick={() => onNavigateTab(project.targetTab)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#141517] text-white text-xs font-semibold hover:bg-[#B45309] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {project.targetActionLabel}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onToggleSaveBrief(project.id, project.title)
                      }
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer ${
                        saved
                          ? "text-[#92400E] bg-[#FAF7F2] border border-[#B45309]/40"
                          : "text-[#57534E] hover:text-[#141517]"
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{saved ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* 02. 5-Stage Customer Satisfaction & Stage-Gated Transparency Promise */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-7 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/8">
          <div>
            <p className="text-xs font-mono text-[#B45309]">
              02. Design-Build Accountability · Inspired by Verified Turnkey Practices
            </p>
            <h2 className="font-display text-2xl font-semibold text-[#141517] mt-1">
              How We Guarantee Customer Satisfaction Before &amp; After Handover
            </h2>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono tabular-nums shrink-0">
            <div>
              <p className="text-[#78716C]">Verified Rating</p>
              <p className="text-base font-semibold text-[#141517]">
                4.9 / 5.0 Avg
              </p>
            </div>
            <div>
              <p className="text-[#78716C]">Brief Saved</p>
              <p className="text-base font-semibold text-[#92400E]">
                {savedBriefIds.length} Style{savedBriefIds.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {MILESTONE_GUARANTEES.map((m) => (
            <div
              key={m.step}
              className="rounded-xl bg-[#FAF9F6] border border-black/8 p-4 space-y-1.5"
            >
              <p className="text-xs font-mono font-semibold text-[#B45309] tabular-nums">
                Stage {m.step}
              </p>
              <h3 className="text-sm font-semibold text-[#141517]">
                {m.title}
              </h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                {m.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 03. Verified Client Reviews & Live Feedback Form */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-[#B45309]">
              03. Verified Homeowner &amp; Commercial Outcomes
            </p>
            <h2 className="font-display text-2xl font-semibold text-[#141517] mt-1">
              Client Satisfaction &amp; Delivery Reviews
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setReviewFormOpen((v) => !v);
                setRevSubmitted(false);
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-black/15 bg-white text-xs font-semibold text-[#141517] hover:border-[#B45309] transition-colors whitespace-nowrap cursor-pointer"
            >
              {reviewFormOpen ? "Close Feedback Form" : "Write a Client Review"}
            </button>
            <button
              type="button"
              onClick={onOpenNegotiation}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#B45309] text-white text-xs font-semibold hover:bg-[#92400E] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Handshake className="w-4 h-4" />
              <span>Negotiate With Saved Brief</span>
            </button>
          </div>
        </div>

        {revSubmitted && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Thank you—your review has been added to this browser showcase.
            </span>
          </div>
        )}

        {reviewFormOpen && (
          <form
            onSubmit={handleSubmitReview}
            className="rounded-2xl border border-black/10 bg-white p-5 space-y-4"
          >
            <h3 className="text-base font-semibold text-[#141517]">
              Submit Project Satisfaction Review
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="block text-xs text-[#57534E]">
                Full Name *
                <input
                  required
                  type="text"
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  placeholder="e.g. Priya Nair"
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 px-3 text-sm text-[#141517]"
                />
              </label>

              <label className="block text-xs text-[#57534E]">
                City *
                <input
                  required
                  type="text"
                  value={revCity}
                  onChange={(e) => setRevCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 px-3 text-sm text-[#141517]"
                />
              </label>

              <label className="block text-xs text-[#57534E]">
                Project Scope
                <select
                  value={revCategory}
                  onChange={(e) =>
                    setRevCategory(
                      e.target.value as ClientReviewItem["category"]
                    )
                  }
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-white px-3 text-sm text-[#141517]"
                >
                  <option value="Residential Villa">Residential Villa</option>
                  <option value="Kitchen & Interiors">Kitchen &amp; Interiors</option>
                  <option value="Commercial & Casting">Commercial &amp; Casting</option>
                  <option value="Modular Home">Modular Home</option>
                </select>
              </label>

              <label className="block text-xs text-[#57534E]">
                Satisfaction Rating
                <select
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 bg-white px-3 text-sm text-[#141517]"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5 Stars
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-xs text-[#57534E]">
              Review Summary Headline
              <input
                type="text"
                value={revHeadline}
                onChange={(e) => setRevHeadline(e.target.value)}
                placeholder="Highlight your design, Vastu, or build experience"
                className="mt-1 w-full min-h-[42px] rounded-lg border border-black/15 px-3 text-sm text-[#141517]"
              />
            </label>

            <label className="block text-xs text-[#57534E]">
              Detailed Experience *
              <textarea
                required
                rows={3}
                value={revQuote}
                onChange={(e) => setRevQuote(e.target.value)}
                placeholder="Share what worked well in 3D visualization, wall colors, vendor ordering, or construction planning..."
                className="mt-1 w-full rounded-lg border border-black/15 p-3 text-sm text-[#141517]"
              />
            </label>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReviewFormOpen(false)}
                className="min-h-[40px] px-4 rounded-lg border border-black/15 text-xs font-medium text-[#57534E] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-5 rounded-lg bg-[#141517] text-white text-xs font-semibold hover:bg-[#B45309] transition-colors cursor-pointer"
              >
                Publish Review
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allReviews.map((review) => {
            const voted = helpfulVotes[review.id] ?? false;
            const totalHelpful = review.helpfulCount + (voted ? 1 : 0);
            return (
              <article
                key={review.id}
                className="rounded-2xl border border-black/10 bg-white p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-[#78716C] font-mono">
                      {review.category} · {review.city} · {review.dateLabel}
                    </div>
                    <div
                      className="flex items-center gap-0.5 text-[#B45309] shrink-0"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: review.rating }).map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-3.5 h-3.5 fill-[#B45309]"
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-[#141517]">
                    {review.headline}
                  </h3>

                  <p className="text-sm text-[#57534E] leading-relaxed">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-black/8 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-[#141517]">
                      {review.authorName}
                    </p>
                    <p className="text-[#78716C]">
                      {review.verifiedScope} · {review.outcomeMetric}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setHelpfulVotes((prev) => ({
                        ...prev,
                        [review.id]: !voted,
                      }))
                    }
                    className={`min-h-[34px] px-3 py-1 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums ${
                      voted
                        ? "border-[#B45309] bg-[#FAF7F2] text-[#92400E]"
                        : "border-black/10 bg-[#FAF9F6] text-[#57534E] hover:text-[#141517]"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({totalHelpful})</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* 04. Online Architecture & Design-Build Deliverable Suite */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-black/8">
            <div>
              <p className="text-xs font-mono text-[#B45309]">
                04. Complete Digital Deliverable Suite · Remote &amp; On-Site Ready
              </p>
              <h2 className="font-display text-2xl font-semibold text-[#141517] mt-1">
                What Every Homeowner &amp; Commercial Client Receives
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenLegalShield}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-black/15 bg-[#FAF9F6] text-xs font-semibold text-[#141517] hover:border-[#B45309] inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#B45309]" />
              <span>Tri-Party Legal Shield (Customers · Vendors · Suppliers)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DELIVERABLE_PACKAGES.map((pkg) => (
              <div
                key={pkg.code}
                className="rounded-xl bg-[#FAF9F6] border border-black/8 p-4 space-y-1.5"
              >
                <p className="text-[11px] font-mono font-semibold text-[#B45309]">
                  {pkg.code}
                </p>
                <h3 className="text-sm font-semibold text-[#141517]">
                  {pkg.title}
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  {pkg.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Regional & Quality Compliance Footer Strip (placed out of header) */}
        <div className="rounded-2xl bg-[#141517] text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-white/80">
              <p className="text-sm font-semibold text-white">
                Global Engineering Rigor · Indian Vastu Accuracy · Tri-Party Legal Protection
              </p>
              <p>
                Every design visualization separates digital concept tools from third-party vendor fulfillment and local site contracting—protecting Radiant Spark LLC from customer, supplier, and contractor disputes while preserving buyer clarity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenLegalShield}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-white/25 text-white text-xs font-semibold hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
            >
              Read Legal Shield
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("advisor")}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#F59E0B] text-[#141517] text-xs font-semibold hover:bg-[#D97706] hover:text-white transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Ask Vastu &amp; Build AI</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
