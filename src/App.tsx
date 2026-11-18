import { useEffect, useState } from "react";
import {
  Building2,
  Compass,
  Crown,
  Hammer,
  Move3d,
  Sparkles,
} from "lucide-react";
import {
  BACKSPLASH_FINISHES,
  CABINET_COLOR_COMBOS,
  CABINET_FINISHES,
  CAST_STRUCTURE_FORMS,
  CASTING_FINISHES,
  CASTING_SYSTEMS,
  CONSTRUCTION_PLANS,
  COUNTERTOP_FINISHES,
  EXTERIOR_FINISHES,
  FURNITURE_OPTIONS,
  HARDWARE_FINISHES,
  PLACEABLE_FURNITURE_CATALOG,
} from "./data/catalog";
import {
  AppTab,
  BuildingSector,
  CabinetColorCombo,
  CabinetDoorStyle,
  CabinetMaterialSpec,
  CastingDropZone,
  CastingFacadeProfile,
  CastingGlazingStyle,
  CastingMaterialSpec,
  CastingMethodId,
  CastingProjectPreset,
  CastStructureForm,
  ConstructionPlan,
  ExteriorDropZone,
  ExteriorMaterialSpec,
  FurnitureOption,
  InteriorDropZone,
  KitchenLayoutType,
  PlaceableFurnitureSpec,
  PlacedFurnitureInstance,
  SubscriptionTier,
  VastuBuyerProfile,
} from "./types";
import { LayoutEditor } from "./components/LayoutEditor";
import { StudioWorkspace } from "./components/StudioWorkspace";
import { ConstructionPlansView } from "./components/ConstructionPlansView";
import { CastingStudioView } from "./components/CastingStudioView";
import { VastuAstrologyAdvisor } from "./components/VastuAstrologyAdvisor";
import { SubscriptionView } from "./components/SubscriptionView";
import { NegotiationModal } from "./components/NegotiationModal";
import { CustomerAIAgentDrawer } from "./components/CustomerAIAgentDrawer";
import { ClientProofPortfolio } from "./components/ClientProofPortfolio";
import {
  LegalSectionId,
  LegalShieldModal,
} from "./components/LegalShieldModal";

const STORAGE_TIER_KEY = "sparklintel_subscription_tier";
const STORAGE_BRIEF_KEY = "sparklintel_saved_brief_v1";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("studio");
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalSection, setLegalSection] =
    useState<LegalSectionId>("engineering");

  const openLegal = (sec: LegalSectionId) => {
    setLegalSection(sec);
    setLegalOpen(true);
  };

  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_TIER_KEY);
        if (saved === "pro" || saved === "studio" || saved === "free") {
          return saved;
        }
      } catch {
        // Ignore storage errors
      }
      return "free";
    }
  );

  const [savedBriefMap, setSavedBriefMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_BRIEF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BRIEF_KEY, JSON.stringify(savedBriefMap));
    } catch {
      // Ignore storage errors
    }
  }, [savedBriefMap]);

  const handleToggleSaveBrief = (projectId: string, projectTitle: string) => {
    setSavedBriefMap((prev) => {
      const next = { ...prev };
      if (next[projectId]) {
        delete next[projectId];
      } else {
        next[projectId] = projectTitle;
      }
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TIER_KEY, subscriptionTier);
    } catch {
      // Ignore storage errors
    }
  }, [subscriptionTier]);

  const [selectedPlan, setSelectedPlan] = useState<ConstructionPlan>(
    CONSTRUCTION_PLANS[0]
  );

  const [activeCombo, setActiveCombo] = useState<CabinetColorCombo>(
    CABINET_COLOR_COMBOS[0]
  );
  const [layout, setLayout] = useState<KitchenLayoutType>("l-island");
  const [doorStyle, setDoorStyle] = useState<CabinetDoorStyle>(
    CABINET_COLOR_COMBOS[0].doorStyle
  );

  const [upperFinish, setUpperFinish] = useState<CabinetMaterialSpec>(
    () =>
      CABINET_FINISHES.find((f) => f.id === CABINET_COLOR_COMBOS[0].upperId) ??
      CABINET_FINISHES[0]
  );
  const [lowerFinish, setLowerFinish] = useState<CabinetMaterialSpec>(
    () =>
      CABINET_FINISHES.find((f) => f.id === CABINET_COLOR_COMBOS[0].lowerId) ??
      CABINET_FINISHES[1]
  );
  const [islandFinish, setIslandFinish] = useState<CabinetMaterialSpec>(
    () =>
      CABINET_FINISHES.find((f) => f.id === CABINET_COLOR_COMBOS[0].islandId) ??
      CABINET_FINISHES[1]
  );
  const [countertopFinish, setCountertopFinish] = useState<CabinetMaterialSpec>(
    () =>
      COUNTERTOP_FINISHES.find(
        (f) => f.id === CABINET_COLOR_COMBOS[0].countertopId
      ) ?? COUNTERTOP_FINISHES[0]
  );
  const [backsplashFinish, setBacksplashFinish] = useState<CabinetMaterialSpec>(
    () =>
      BACKSPLASH_FINISHES.find(
        (f) => f.id === CABINET_COLOR_COMBOS[0].backsplashId
      ) ?? BACKSPLASH_FINISHES[0]
  );
  const [hardwareFinish, setHardwareFinish] = useState<CabinetMaterialSpec>(
    () =>
      HARDWARE_FINISHES.find(
        (f) => f.id === CABINET_COLOR_COMBOS[0].hardwareId
      ) ?? HARDWARE_FINISHES[0]
  );

  // Exterior House Builder Finishes
  const [facadeFinish, setFacadeFinish] = useState<ExteriorMaterialSpec>(
    () => EXTERIOR_FINISHES.find((f) => f.zone === "facade")!
  );
  const [claddingFinish, setCladdingFinish] = useState<ExteriorMaterialSpec>(
    () => EXTERIOR_FINISHES.find((f) => f.zone === "cladding")!
  );
  const [timberFinish, setTimberFinish] = useState<ExteriorMaterialSpec>(
    () => EXTERIOR_FINISHES.find((f) => f.zone === "timber")!
  );
  const [roofTrimFinish, setRoofTrimFinish] = useState<ExteriorMaterialSpec>(
    () => EXTERIOR_FINISHES.find((f) => f.zone === "roofTrim")!
  );

  // 3D Structural & Architectural Casting State
  const [castingStructureForm, setCastingStructureForm] =
    useState<CastStructureForm>("building-frame");
  const [castingSector, setCastingSector] =
    useState<BuildingSector>("residential");
  const [castingMethodId, setCastingMethodId] =
    useState<CastingMethodId>("gfrc-sculptural");
  const [castingFacadeProfile, setCastingFacadeProfile] =
    useState<CastingFacadeProfile>("arched-gfrc");
  const [castingGlazingStyle, setCastingGlazingStyle] =
    useState<CastingGlazingStyle>("arched-bronze");
  const [castingFloors, setCastingFloors] = useState<number>(2);
  const [castingBays, setCastingBays] = useState<number>(3);
  const [concreteFinish, setConcreteFinish] = useState<CastingMaterialSpec>(
    () => CASTING_FINISHES.find((f) => f.id === "cast-travertine")!
  );
  const [shellAccentFinish, setShellAccentFinish] =
    useState<CastingMaterialSpec>(
      () => CASTING_FINISHES.find((f) => f.id === "shell-gfrc-white")!
    );
  const [mullionFinish, setMullionFinish] = useState<CastingMaterialSpec>(
    () => CASTING_FINISHES.find((f) => f.id === "mullion-bronze")!
  );
  const [lobbyInteriorFinish, setLobbyInteriorFinish] =
    useState<CastingMaterialSpec>(
      () => CASTING_FINISHES.find((f) => f.id === "lobby-boucle-travertine")!
    );

  const [diningOption, setDiningOption] = useState<FurnitureOption>(
    () => FURNITURE_OPTIONS.find((f) => f.category === "dining")!
  );
  const [stoolOption, setStoolOption] = useState<FurnitureOption>(
    () => FURNITURE_OPTIONS.find((f) => f.category === "stools")!
  );
  const [sofaOption, setSofaOption] = useState<FurnitureOption>(
    () => FURNITURE_OPTIONS.find((f) => f.category === "sofa")!
  );
  const [lightingOption, setLightingOption] = useState<FurnitureOption>(
    () => FURNITURE_OPTIONS.find((f) => f.category === "lighting")!
  );

  // Subscribed Custom Drag-and-Drop Furniture Collection (Sophia Key & George Buildings)
  const [placedFurniture, setPlacedFurniture] = useState<
    PlacedFurnitureInstance[]
  >(() =>
    PLACEABLE_FURNITURE_CATALOG.filter((item) => !item.proOnly).map(
      (spec, idx) => ({
        instanceId: `seed-${spec.id}-${idx}`,
        specId: spec.id,
        name: spec.name,
        collection: spec.collection,
        shape: spec.shape,
        primaryHex: spec.primaryHex,
        accentHex: spec.accentHex,
        isWood: spec.isWood,
        x: spec.defaultX,
        z: spec.defaultZ,
        rotationY: 0,
      })
    )
  );
  const [selectedFurnitureInstanceId, setSelectedFurnitureInstanceId] =
    useState<string | null>(null);

  const [buyerProfile, setBuyerProfile] = useState<VastuBuyerProfile>({
    plotFacing: "North",
    kitchenZone: "South-East (Agneya — Ideal)",
    masterBedroomZone: "South-West (Nairutya)",
    rashi: "Vrishabha (Taurus) — Earth",
    nakshatra: "Rohini",
    propertyType: "New House / Under Construction",
    cityOrClimate: "Bengaluru",
  });

  const applyCombo = (combo: CabinetColorCombo) => {
    setActiveCombo(combo);
    setDoorStyle(combo.doorStyle);
    const u = CABINET_FINISHES.find((f) => f.id === combo.upperId);
    const l = CABINET_FINISHES.find((f) => f.id === combo.lowerId);
    const isl = CABINET_FINISHES.find((f) => f.id === combo.islandId);
    const ct = COUNTERTOP_FINISHES.find((f) => f.id === combo.countertopId);
    const bs = BACKSPLASH_FINISHES.find((f) => f.id === combo.backsplashId);
    const hw = HARDWARE_FINISHES.find((f) => f.id === combo.hardwareId);
    if (u) setUpperFinish(u);
    if (l) setLowerFinish(l);
    if (isl) setIslandFinish(isl);
    if (ct) setCountertopFinish(ct);
    if (bs) setBacksplashFinish(bs);
    if (hw) setHardwareFinish(hw);
  };

  const handleChangeFinish = (
    slot: InteriorDropZone,
    spec: CabinetMaterialSpec
  ) => {
    if (slot === "upper") setUpperFinish(spec);
    if (slot === "lower") setLowerFinish(spec);
    if (slot === "island") setIslandFinish(spec);
    if (slot === "countertop") setCountertopFinish(spec);
    if (slot === "backsplash") setBacksplashFinish(spec);
    if (slot === "hardware") setHardwareFinish(spec);
  };

  const handleChangeExteriorFinish = (
    zone: ExteriorDropZone,
    spec: ExteriorMaterialSpec
  ) => {
    if (zone === "facade") setFacadeFinish(spec);
    if (zone === "cladding") setCladdingFinish(spec);
    if (zone === "timber") setTimberFinish(spec);
    if (zone === "roofTrim") setRoofTrimFinish(spec);
  };

  const handleChangeCastFinish = (
    zone: CastingDropZone,
    spec: CastingMaterialSpec
  ) => {
    if (zone === "concrete") setConcreteFinish(spec);
    if (zone === "shellAccent") setShellAccentFinish(spec);
    if (zone === "mullions") setMullionFinish(spec);
    if (zone === "lobbyInterior") setLobbyInteriorFinish(spec);
  };

  const handleApplyCastingPreset = (preset: CastingProjectPreset) => {
    setCastingSector(preset.sector);
    setCastingMethodId(preset.methodId);
    setCastingFacadeProfile(preset.facadeProfile);
    setCastingGlazingStyle(preset.glazingStyle);
    setCastingFloors(preset.floors);
    setCastingBays(preset.bays);
    const c = CASTING_FINISHES.find((f) => f.id === preset.concreteId);
    const s = CASTING_FINISHES.find((f) => f.id === preset.shellAccentId);
    const m = CASTING_FINISHES.find((f) => f.id === preset.mullionsId);
    const l = CASTING_FINISHES.find((f) => f.id === preset.lobbyInteriorId);
    if (c) setConcreteFinish(c);
    if (s) setShellAccentFinish(s);
    if (m) setMullionFinish(m);
    if (l) setLobbyInteriorFinish(l);
  };

  const handleSelectFurniture = (item: FurnitureOption) => {
    if (item.category === "dining") setDiningOption(item);
    if (item.category === "stools") setStoolOption(item);
    if (item.category === "sofa") setSofaOption(item);
    if (item.category === "lighting") setLightingOption(item);
  };

  const handleAddPlacedFurniture = (
    spec: PlaceableFurnitureSpec,
    x?: number,
    z?: number
  ) => {
    const offset = (placedFurniture.length % 4) * 0.25;
    const newInst: PlacedFurnitureInstance = {
      instanceId: `furn-${spec.id}-${Date.now()}`,
      specId: spec.id,
      name: spec.name,
      collection: spec.collection,
      shape: spec.shape,
      primaryHex: spec.primaryHex,
      accentHex: spec.accentHex,
      isWood: spec.isWood,
      x:
        x !== undefined
          ? Math.max(-5.8, Math.min(3.1, Number(x.toFixed(2))))
          : Number((spec.defaultX + offset).toFixed(2)),
      z:
        z !== undefined
          ? Math.max(-0.8, Math.min(5.2, Number(z.toFixed(2))))
          : Number((spec.defaultZ + offset).toFixed(2)),
      rotationY: 0,
    };
    setPlacedFurniture((prev) => [...prev, newInst]);
    setSelectedFurnitureInstanceId(newInst.instanceId);
  };

  const handleMovePlacedFurniture = (
    instanceId: string,
    x: number,
    z: number
  ) => {
    setPlacedFurniture((prev) =>
      prev.map((item) =>
        item.instanceId === instanceId ? { ...item, x, z } : item
      )
    );
  };

  const handleRotatePlacedFurniture = (instanceId: string) => {
    setPlacedFurniture((prev) =>
      prev.map((item) =>
        item.instanceId === instanceId
          ? { ...item, rotationY: item.rotationY + Math.PI / 4 }
          : item
      )
    );
  };

  const handleRemovePlacedFurniture = (instanceId: string) => {
    setPlacedFurniture((prev) =>
      prev.filter((item) => item.instanceId !== instanceId)
    );
    setSelectedFurnitureInstanceId((curr) =>
      curr === instanceId ? null : curr
    );
  };

  const handleLoadPlanIn3D = (
    plan: ConstructionPlan,
    targetLayout: KitchenLayoutType
  ) => {
    setSelectedPlan(plan);
    if (subscriptionTier !== "free") {
      setLayout(targetLayout);
      const recCombo = CABINET_COLOR_COMBOS.find(
        (c) => c.id === plan.recommendedComboId
      );
      if (recCombo) applyCombo(recCombo);
    } else {
      setLayout("l-island");
      const freeCombo = CABINET_COLOR_COMBOS.find(
        (c) => c.id === plan.recommendedComboId && !c.proOnly
      );
      if (freeCombo) applyCombo(freeCombo);
    }
    setBuyerProfile((prev) => ({
      ...prev,
      plotFacing: plan.facing,
    }));
    setActiveTab("studio");
  };

  const isSubscribed = subscriptionTier !== "free";

  return (
    <div className="min-h-dvh flex flex-col bg-[#F8F7F4] text-[#141517]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="h-[52px] md:h-[64px] bg-white border-b border-black/8 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 md:gap-8 shrink-0">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          onClick={() => setActiveTab("studio")}
          className="font-display text-[13.5px] sm:text-lg font-bold tracking-tight text-[#141517] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Spark&amp;Lintel Design-Builders
        </button>

        {/* Zone 2: Clean Text Nav Links (Desktop) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-5 lg:gap-7 text-xs lg:text-sm font-medium text-[#57534E]"
        >
          {[
            { id: "studio" as AppTab, label: "Spark Interior Designs" },
            { id: "plans" as AppTab, label: "Spark Construction" },
            { id: "casting" as AppTab, label: "3D Casting" },
            { id: "advisor" as AppTab, label: "Vastu & Astrology AI" },
            { id: "pricing" as AppTab, label: "Subscriptions" },
          ].map((nav) => {
            const active = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "border-[#B45309] text-[#141517] font-semibold"
                    : "border-transparent hover:text-[#141517]"
                }`}
              >
                {nav.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <button
            onClick={() => setActiveTab("pricing")}
            className={`min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isSubscribed
                ? "bg-[#EFECE6] text-[#92400E] hover:bg-[#E5E0D5]"
                : "bg-[#141517] text-white hover:bg-[#292B2F]"
            }`}
          >
            {isSubscribed ? (
              <>
                <Crown className="w-3.5 h-3.5 text-[#B45309]" />
                <span>
                  {subscriptionTier === "studio"
                    ? "Studio Active"
                    : "Pro Active"}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Unlock Pro 3D</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1">
        {activeTab === "studio" && (
          <StudioWorkspace
            selectedPlan={selectedPlan}
            subscriptionTier={subscriptionTier}
            layout={layout}
            onChangeLayout={setLayout}
            doorStyle={doorStyle}
            onChangeDoorStyle={setDoorStyle}
            activeCombo={activeCombo}
            onSelectCombo={applyCombo}
            upperFinish={upperFinish}
            lowerFinish={lowerFinish}
            islandFinish={islandFinish}
            countertopFinish={countertopFinish}
            backsplashFinish={backsplashFinish}
            hardwareFinish={hardwareFinish}
            onChangeFinish={handleChangeFinish}
            diningOption={diningOption}
            stoolOption={stoolOption}
            sofaOption={sofaOption}
            lightingOption={lightingOption}
            onSelectFurniture={handleSelectFurniture}
            placedFurniture={placedFurniture}
            selectedFurnitureInstanceId={selectedFurnitureInstanceId}
            onSelectPlacedFurniture={setSelectedFurnitureInstanceId}
            onAddPlacedFurniture={handleAddPlacedFurniture}
            onMovePlacedFurniture={handleMovePlacedFurniture}
            onRotatePlacedFurniture={handleRotatePlacedFurniture}
            onRemovePlacedFurniture={handleRemovePlacedFurniture}
            onOpenSubscription={() => setActiveTab("pricing")}
            onAskVastuAI={() => setActiveTab("advisor")}
            onOpenNegotiation={() => setNegotiationOpen(true)}
            onOpenVendorLegal={() => openLegal("vendors")}
          />
        )}

        {activeTab === "plans" && (
          <ConstructionPlansView
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onLoadPlanIn3D={handleLoadPlanIn3D}
            subscriptionTier={subscriptionTier}
            onOpenPricing={() => setActiveTab("pricing")}
            facadeFinish={facadeFinish}
            claddingFinish={claddingFinish}
            timberFinish={timberFinish}
            roofTrimFinish={roofTrimFinish}
            onChangeExteriorFinish={handleChangeExteriorFinish}
            onOpenNegotiation={() => setNegotiationOpen(true)}
          />
        )}

        {activeTab === "casting" && (
          <CastingStudioView
            subscriptionTier={subscriptionTier}
            onOpenPricing={() => setActiveTab("pricing")}
            structureForm={castingStructureForm}
            onChangeStructureForm={setCastingStructureForm}
            sector={castingSector}
            onChangeSector={setCastingSector}
            methodId={castingMethodId}
            onChangeMethodId={setCastingMethodId}
            facadeProfile={castingFacadeProfile}
            onChangeFacadeProfile={setCastingFacadeProfile}
            glazingStyle={castingGlazingStyle}
            onChangeGlazingStyle={setCastingGlazingStyle}
            floors={castingFloors}
            onChangeFloors={setCastingFloors}
            bays={castingBays}
            onChangeBays={setCastingBays}
            concreteFinish={concreteFinish}
            shellAccentFinish={shellAccentFinish}
            mullionFinish={mullionFinish}
            lobbyInteriorFinish={lobbyInteriorFinish}
            onChangeCastFinish={handleChangeCastFinish}
            onApplyPreset={handleApplyCastingPreset}
            onOpenNegotiation={() => setNegotiationOpen(true)}
          />
        )}

        {activeTab === "advisor" && (
          <VastuAstrologyAdvisor
            selectedPlan={selectedPlan}
            kitchenLayout={layout}
            activeCombo={activeCombo}
            upperFinish={upperFinish}
            lowerFinish={lowerFinish}
            countertopFinish={countertopFinish}
            hardwareFinish={hardwareFinish}
            subscriptionTier={subscriptionTier}
            buyerProfile={buyerProfile}
            onUpdateProfile={setBuyerProfile}
          />
        )}

        {activeTab === "pricing" && (
          <SubscriptionView
            currentTier={subscriptionTier}
            onSelectTier={(tier) => setSubscriptionTier(tier)}
            onReturnToStudio={() => setActiveTab("studio")}
          />
        )}

        {(activeTab === "studio" || activeTab === "casting") && (
          <div className="pb-4">
            <LayoutEditor
              key={activeTab}
              mode={activeTab === "studio" ? "interior" : "casting"}
              preview={isSubscribed}
              onPlans={() => setActiveTab("pricing")}
            />
          </div>
        )}

        {(activeTab === "studio" ||
          activeTab === "plans" ||
          activeTab === "casting") && (
          <ClientProofPortfolio
            savedBriefIds={Object.keys(savedBriefMap)}
            onToggleSaveBrief={handleToggleSaveBrief}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenNegotiation={() => setNegotiationOpen(true)}
            onOpenLegalShield={() => openLegal("vendors")}
          />
        )}
      </main>

      {/* Global Legal Shield Footer */}
      <footer className="bg-white border-t border-black/8 px-4 sm:px-6 lg:px-8 py-5 pb-20 md:pb-5 text-xs text-[#57534E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[#57534E]">
            <strong className="text-[#141517]">
              Spark&amp;Lintel Design-Builders
            </strong>{" "}
            · Conceptual 3D designs &amp; casting previews require local licensed
            PE/architect stamping prior to construction.
          </p>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              onClick={() => openLegal("engineering")}
              className="hover:text-[#141517] underline-offset-4 hover:underline cursor-pointer"
            >
              Engineering Disclaimer
            </button>
            <button
              onClick={() => openLegal("vastu")}
              className="hover:text-[#141517] underline-offset-4 hover:underline cursor-pointer"
            >
              Vastu Notice
            </button>
            <button
              onClick={() => openLegal("privacy")}
              className="hover:text-[#141517] underline-offset-4 hover:underline cursor-pointer"
            >
              Global Privacy
            </button>
            <button
              onClick={() => openLegal("terms")}
              className="hover:text-[#141517] underline-offset-4 hover:underline cursor-pointer"
            >
              Terms &amp; Global Shield
            </button>
          </div>
        </div>
      </footer>

      {/* Global Legal Shield Modal */}
      <LegalShieldModal
        isOpen={legalOpen}
        initialSection={legalSection}
        onClose={() => setLegalOpen(false)}
      />

      {/* Persistent Floating AI Customer Q&A Agent */}
      <CustomerAIAgentDrawer
        hidden={activeTab === "advisor"}
        selectedPlan={selectedPlan}
        kitchenLayout={layout}
        activeCombo={activeCombo}
        upperFinish={upperFinish}
        lowerFinish={lowerFinish}
        countertopFinish={countertopFinish}
        hardwareFinish={hardwareFinish}
        castingContext={{
          sector: castingSector,
          methodName: `${
            CAST_STRUCTURE_FORMS.find((f) => f.id === castingStructureForm)
              ?.name ?? castingStructureForm
          } · ${
            CASTING_SYSTEMS.find((s) => s.id === castingMethodId)?.name ??
            castingMethodId
          }`,
          floors: castingFloors,
          bays: castingBays,
          concreteFinish: concreteFinish.name,
        }}
        subscriptionTier={subscriptionTier}
        buyerProfile={buyerProfile}
        onOpenFullAdvisor={() => setActiveTab("advisor")}
      />

      {/* Negotiation Proposal Modal */}
      <NegotiationModal
        isOpen={negotiationOpen}
        onClose={() => setNegotiationOpen(false)}
        planName={selectedPlan.name}
        planAreaSqFt={selectedPlan.areaSqFt}
        vastuFacing={selectedPlan.facing}
        interiorSummary={`${activeCombo.name} (${upperFinish.name} / ${lowerFinish.name}, ${countertopFinish.name}) + ${placedFurniture.length} Placed Pieces`}
        exteriorSummary={`${facadeFinish.name} facade, ${claddingFinish.name}, ${timberFinish.name}`}
        castingSummary={`${castingSector.toUpperCase()} · ${
          CAST_STRUCTURE_FORMS.find((f) => f.id === castingStructureForm)
            ?.name ?? castingStructureForm
        } · ${
          CASTING_SYSTEMS.find((s) => s.id === castingMethodId)?.name ??
          castingMethodId
        } (${castingFloors}F × ${castingBays} Bays, ${concreteFinish.name})`}
        savedBriefStyles={Object.values(savedBriefMap)}
      />

      {/* Mobile Bottom Thumb-Zone Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[56px] bg-white border-t border-black/10 grid grid-cols-5 items-center"
      >
        {[
          { id: "studio" as AppTab, label: "Interiors", icon: Move3d },
          { id: "plans" as AppTab, label: "Construct", icon: Hammer },
          { id: "casting" as AppTab, label: "Casting", icon: Building2 },
          { id: "advisor" as AppTab, label: "Vastu AI", icon: Compass },
          { id: "pricing" as AppTab, label: "Subscribe", icon: Crown },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                active ? "text-[#B45309] font-semibold" : "text-[#57534E]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
