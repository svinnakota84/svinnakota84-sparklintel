import React, { useEffect, useRef, useState } from "react";
import {
  Compass,
  Crown,
  Download,
  GripVertical,
  Hammer,
  Handshake,
  Layers,
  Lock,
  Move3d,
  Ruler,
  Zap,
} from "lucide-react";
import {
  CONSTRUCTION_PLANS,
  EXTERIOR_FINISHES,
  HOUSE_BUILD_STAGES,
} from "../data/catalog";
import {
  ConstructionPlan,
  ExteriorDropZone,
  ExteriorMaterialSpec,
  KitchenLayoutType,
  PlanRoom,
  SubscriptionTier,
} from "../types";
import { HouseBuilder3DViewer } from "./HouseBuilder3DViewer";

interface ConstructionPlansViewProps {
  selectedPlan: ConstructionPlan;
  onSelectPlan: (plan: ConstructionPlan) => void;
  onLoadPlanIn3D: (plan: ConstructionPlan, layout: KitchenLayoutType) => void;
  subscriptionTier: SubscriptionTier;
  onOpenPricing: () => void;
  facadeFinish: ExteriorMaterialSpec;
  claddingFinish: ExteriorMaterialSpec;
  timberFinish: ExteriorMaterialSpec;
  roofTrimFinish: ExteriorMaterialSpec;
  onChangeExteriorFinish: (
    zone: ExteriorDropZone,
    spec: ExteriorMaterialSpec
  ) => void;
  onOpenNegotiation: () => void;
}

export const ConstructionPlansView: React.FC<ConstructionPlansViewProps> = ({
  selectedPlan,
  onSelectPlan,
  onLoadPlanIn3D,
  subscriptionTier,
  onOpenPricing,
  facadeFinish,
  claddingFinish,
  timberFinish,
  roofTrimFinish,
  onChangeExteriorFinish,
  onOpenNegotiation,
}) => {
  const [buildStage, setBuildStage] = useState<number>(5);
  const [activeExteriorZone, setActiveExteriorZone] =
    useState<ExteriorDropZone>("facade");
  const [draggedExtFinish, setDraggedExtFinish] =
    useState<ExteriorMaterialSpec | null>(null);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [touchDragPos, setTouchDragPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const touchDraggingExtRef = useRef<ExteriorMaterialSpec | null>(null);
  const ignoreNextExtClickRef = useRef(false);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!touchDraggingExtRef.current) return;
      setTouchDragPos({ x: e.clientX, y: e.clientY });
      const els = document.elementsFromPoint(e.clientX, e.clientY);
      const stageEl = els.find((el) =>
        el.hasAttribute("data-3d-stage")
      ) as HTMLElement | undefined;
      if (stageEl) {
        stageEl.dispatchEvent(
          new CustomEvent("sparkhover", {
            detail: { clientX: e.clientX, clientY: e.clientY },
          })
        );
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const activeDrag = touchDraggingExtRef.current;
      if (!activeDrag) return;
      touchDraggingExtRef.current = null;
      setTouchDragPos(null);
      window.setTimeout(() => {
        ignoreNextExtClickRef.current = false;
      }, 120);

      const els = document.elementsFromPoint(e.clientX, e.clientY);
      const zoneBtn = els.find((el) =>
        el.hasAttribute("data-zone-drop")
      ) as HTMLElement | undefined;

      if (zoneBtn) {
        const z = zoneBtn.getAttribute("data-zone-drop") as ExteriorDropZone;
        if (activeDrag.proOnly && subscriptionTier === "free") {
          setLockNotice(activeDrag.name);
        } else {
          onChangeExteriorFinish(z, activeDrag);
          if (buildStage < 3) setBuildStage(5);
        }
        setDraggedExtFinish(null);
        return;
      }

      const stageEl = els.find((el) =>
        el.hasAttribute("data-3d-stage")
      ) as HTMLElement | undefined;
      if (stageEl) {
        stageEl.dispatchEvent(
          new CustomEvent("sparkdrop", {
            detail: { clientX: e.clientX, clientY: e.clientY },
          })
        );
      } else {
        setDraggedExtFinish(null);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [subscriptionTier, onChangeExteriorFinish, buildStage]);

  const startTouchDrag = (
    e: React.PointerEvent,
    spec: ExteriorMaterialSpec
  ) => {
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    ignoreNextExtClickRef.current = true;
    touchDraggingExtRef.current = spec;
    setDraggedExtFinish(spec);
    setTouchDragPos({ x: e.clientX, y: e.clientY });
  };

  const [showRccGrid, setShowRccGrid] = useState(true);
  const [showVastuOverlay, setShowVastuOverlay] = useState(true);
  const [showMepLines, setShowMepLines] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [activeRoom, setActiveRoom] = useState<PlanRoom | null>(
    selectedPlan.rooms.find((r) => r.isKitchen) ?? selectedPlan.rooms[0]
  );

  const isSubscribed = subscriptionTier !== "free";

  const handlePlanChange = (plan: ConstructionPlan) => {
    onSelectPlan(plan);
    setActiveRoom(plan.rooms.find((r) => r.isKitchen) ?? plan.rooms[0]);
  };

  const handleDropExterior = (
    zone: ExteriorDropZone,
    spec: ExteriorMaterialSpec
  ) => {
    if (spec.proOnly && !isSubscribed) {
      setLockNotice(spec.name);
      setDraggedExtFinish(null);
      return;
    }
    onChangeExteriorFinish(zone, spec);
    if (buildStage < 3) setBuildStage(5);
    setDraggedExtFinish(null);
  };

  const handleDownloadSpec = () => {
    if (!isSubscribed) {
      onOpenPricing();
      return;
    }
    const specText = [
      `SPARK&LINTEL DESIGN-BUILDERS — SPARK CONSTRUCTION SPECIFICATION (${selectedPlan.code})`,
      `Project: ${selectedPlan.name}`,
      `Orientation: ${selectedPlan.facing} Facing · Plot: ${selectedPlan.plotSizeFt}`,
      `Total Area: ${selectedPlan.areaSqFt} sq ft · Vastu Score: ${selectedPlan.vastuScore}%`,
      `Structural System: ${selectedPlan.structuralSystem}`,
      `Foundation: ${selectedPlan.foundationType}`,
      `Slab Thickness: ${selectedPlan.slabThicknessMm} mm`,
      `Seismic Compliance: ${selectedPlan.seismicZone}`,
      `Electrical Load: ${selectedPlan.electricalLoadKw} kW (3-Phase)`,
      ``,
      `SELECTED EXTERIOR PALETTE:`,
      `- Facade Plaster: ${facadeFinish.name}`,
      `- Stone Plinth & Cladding: ${claddingFinish.name}`,
      `- Timber Louvers & Soffits: ${timberFinish.name}`,
      `- Roof & Window Mullions: ${roofTrimFinish.name}`,
      ``,
      `ENGINEERING HIGHLIGHTS:`,
      ...selectedPlan.engineeringHighlights.map((h, i) => `${i + 1}. ${h}`),
      ``,
      `ROOM & VASTU SCHEDULE:`,
      ...selectedPlan.rooms.map(
        (r) => `- ${r.name} (${r.dimensionsFt}) [${r.zone}]: ${r.vastuNote}`
      ),
    ].join("\n");

    const blob = new Blob([specText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedPlan.code}_${selectedPlan.id}_engineering_spec.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const zoneFinishes = EXTERIOR_FINISHES.filter(
    (f) => f.zone === activeExteriorZone
  );
  const currentZoneSelection =
    activeExteriorZone === "facade"
      ? facadeFinish
      : activeExteriorZone === "cladding"
      ? claddingFinish
      : activeExteriorZone === "timber"
      ? timberFinish
      : roofTrimFinish;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-14 space-y-8">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-black/8">
        <div>
          <p className="text-xs font-mono text-[#B45309] tracking-wide">
            Interactive 3D House Builder · Structural Engineering · Drag Exterior Colors
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#141517] mt-1">
            Spark Construction — Build &amp; Customize Your House
          </h1>
          <p className="text-sm text-[#57534E] mt-1 max-w-2xl">
            Step through each civil construction stage from foundation to finished
            home, drag exterior stone, timber, and stucco colors onto the 3D
            house, and negotiate pricing only after you love the build.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadSpec}
            className="min-h-[44px] px-4 py-2 text-xs font-medium rounded-lg border border-black/15 bg-white text-[#141517] hover:bg-[#F3F1EC] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {isSubscribed ? (
              <Download className="w-4 h-4 text-[#B45309]" />
            ) : (
              <Lock className="w-4 h-4 text-[#78716C]" />
            )}
            <span>{isSubscribed ? "Download Spec Sheet" : "Spec Sheet (Pro)"}</span>
          </button>
          <button
            onClick={onOpenNegotiation}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg bg-[#B45309] text-white hover:bg-[#92400E] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Handshake className="w-4 h-4" />
            <span>Negotiate This Build</span>
          </button>
        </div>
      </div>

      {/* Residence Model Selector (NO Villa Prices Shown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CONSTRUCTION_PLANS.map((plan) => {
          const isSelected = plan.id === selectedPlan.id;
          return (
            <button
              key={plan.id}
              onClick={() => handlePlanChange(plan)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
                isSelected
                  ? "bg-white border-[#B45309] shadow-sm"
                  : "bg-white/70 border-black/8 hover:border-black/20 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[#78716C] tabular-nums">
                <span>{plan.code}</span>
                <span className="text-[#92400E] font-medium">
                  Vastu {plan.vastuScore}%
                </span>
              </div>
              <h3 className="font-semibold text-sm text-[#141517] mt-1.5">
                {plan.name}
              </h3>
              <p className="text-xs text-[#57534E] mt-1 tabular-nums">
                {plan.facing} Facing · {plan.areaSqFt.toLocaleString()} sq ft ·{" "}
                {plan.bedrooms}
              </p>
              <p className="text-[11px] font-medium text-[#B45309] mt-2">
                Custom Quote · Negotiate After Design
              </p>
            </button>
          );
        })}
      </div>

      {/* Interactive 3D House Builder + Drag-Color Exterior Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-black/8 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-black/8 flex flex-wrap items-center justify-between gap-2 bg-[#FAF9F6]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#141517]">
              <Hammer className="w-4 h-4 text-[#B45309]" />
              <span>
                3D House Builder — Stage {buildStage} of 5:{" "}
                {HOUSE_BUILD_STAGES[buildStage - 1].title}
              </span>
            </div>
            <span className="text-[11px] text-[#57534E]">
              Drag facade colors onto the 3D house or rotate 360°
            </span>
          </div>

          <div className="relative h-[330px] sm:h-[480px] w-full">
            <HouseBuilder3DViewer
              plan={selectedPlan}
              buildStage={buildStage}
              facadeFinish={facadeFinish}
              claddingFinish={claddingFinish}
              timberFinish={timberFinish}
              roofTrimFinish={roofTrimFinish}
              draggedFinish={draggedExtFinish}
              onDropFinishOnHouse={handleDropExterior}
            />

            {lockNotice && !isSubscribed && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm bg-[#141517] text-white rounded-xl p-4 shadow-xl">
                <p className="text-xs font-mono text-[#F59E0B] flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Subscription Material</span>
                </p>
                <p className="text-sm font-semibold mt-1">
                  Unlock &ldquo;{lockNotice}&rdquo; exterior finish
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLockNotice(null);
                      onOpenPricing();
                    }}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#F59E0B] text-[#141517] text-xs font-semibold cursor-pointer"
                  >
                    View Subscriptions
                  </button>
                  <button
                    onClick={() => setLockNotice(null)}
                    className="text-xs text-white/70 px-2 py-1 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5-Stage Construction Stepper */}
          <div className="p-4 border-t border-black/8 bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {HOUSE_BUILD_STAGES.map((s) => {
                const active = buildStage === s.stage;
                const built = buildStage >= s.stage;
                return (
                  <button
                    key={s.stage}
                    onClick={() => setBuildStage(s.stage)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? "border-[#B45309] bg-[#FAF7F2]"
                        : built
                        ? "border-black/15 bg-white"
                        : "border-black/8 bg-[#FAF9F6] opacity-75"
                    }`}
                  >
                    <p className="text-[10px] font-mono text-[#92400E]">
                      STAGE 0{s.stage}
                    </p>
                    <p className="text-xs font-semibold text-[#141517] mt-0.5 truncate">
                      {s.title}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#57534E] mt-2.5">
              {HOUSE_BUILD_STAGES[buildStage - 1].subtitle}
            </p>
          </div>
        </div>

        {/* Right Column: Drag-the-Color Exterior Finishes Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-black/8 p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-[#B45309]">
                Drag-and-Drop Exterior Palette
              </p>
              <h2 className="font-display text-xl font-semibold text-[#141517] mt-0.5">
                Drag Colors Onto House
              </h2>
              <p className="text-xs text-[#57534E] mt-1">
                Pick a zone below, then drag any color/stone/timber swatch onto
                the 3D house or tap to apply.
              </p>
            </div>

            {/* Drop Zone Selector Tabs */}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "facade", label: "Facade Walls", spec: facadeFinish },
                  { id: "cladding", label: "Stone Plinth", spec: claddingFinish },
                  { id: "timber", label: "Timber Louvers", spec: timberFinish },
                  { id: "roofTrim", label: "Roof & Mullions", spec: roofTrimFinish },
                ] as const
              ).map((z) => {
                const active = activeExteriorZone === z.id;
                return (
                  <button
                    key={z.id}
                    data-zone-drop={z.id}
                    onClick={() => setActiveExteriorZone(z.id)}
                    onDragOver={(e) => {
                      if (draggedExtFinish) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedExtFinish) {
                        handleDropExterior(z.id, draggedExtFinish);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      draggedExtFinish
                        ? "border-dashed border-[#B45309] bg-[#FAF7F2]"
                        : active
                        ? "border-[#B45309] bg-[#FAF7F2]"
                        : "border-black/10 bg-[#FAF9F6]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: z.spec.hex }}
                      />
                      <span className="text-xs font-semibold text-[#141517] truncate">
                        {z.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#57534E] truncate mt-1">
                      {z.spec.name}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Draggable Swatches for Active Zone */}
            <div className="space-y-2 pt-2 border-t border-black/8">
              <p className="text-xs font-medium text-[#57534E]">
                Available Finishes ({zoneFinishes.length})
              </p>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {zoneFinishes.map((spec) => {
                  const locked = spec.proOnly && !isSubscribed;
                  const isSelected = currentZoneSelection.id === spec.id;
                  return (
                    <button
                      key={spec.id}
                      draggable
                      onDragStart={() => setDraggedExtFinish(spec)}
                      onDragEnd={() => setDraggedExtFinish(null)}
                      onClick={() => {
                        if (ignoreNextExtClickRef.current) {
                          ignoreNextExtClickRef.current = false;
                          return;
                        }
                        handleDropExterior(activeExteriorZone, spec);
                      }}
                      className={`w-full min-h-[46px] px-3 py-2 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? "border-[#B45309] bg-[#FAF7F2]"
                          : "border-black/10 bg-white hover:border-black/25"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          onPointerDown={(e) => startTouchDrag(e, spec)}
                          className="touch-none inline-flex items-center justify-center p-1 -ml-1 text-[#78716C] shrink-0"
                          aria-label={`Drag ${spec.name}`}
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                        <span
                          className="w-6 h-6 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: spec.hex }}
                        />
                        <span className="text-xs font-medium text-[#141517] truncate">
                          {spec.name}
                        </span>
                      </span>
                      {locked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#92400E] shrink-0">
                          <Lock className="w-3 h-3" />
                          PRO
                        </span>
                      ) : isSelected ? (
                        <span className="text-[10px] font-mono text-[#92400E] shrink-0">
                          Applied
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-black/8 space-y-2.5">
            <button
              onClick={() =>
                onLoadPlanIn3D(selectedPlan, selectedPlan.recommendedLayout)
              }
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#141517] text-white text-xs font-semibold hover:bg-[#292B2F] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Move3d className="w-4 h-4 text-[#F59E0B]" />
              <span>Design This House&apos;s Kitchen in 3D</span>
            </button>
            <p className="text-[11px] text-[#78716C] text-center">
              No upfront villa prices — negotiate custom build scope after
              designing.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Engineering Blueprint & Specs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive CAD Blueprint Viewer */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-black/8 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-black/8">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#57534E]">
              <Layers className="w-4 h-4 text-[#B45309]" />
              <span>Structural Floor Plan &amp; Vastu Layers</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  label: "RCC Grid",
                  active: showRccGrid,
                  toggle: () => setShowRccGrid((v) => !v),
                },
                {
                  label: "Vastu Zones",
                  active: showVastuOverlay,
                  toggle: () => setShowVastuOverlay((v) => !v),
                },
                {
                  label: "MEP Lines",
                  active: showMepLines,
                  toggle: () => setShowMepLines((v) => !v),
                },
                {
                  label: "Dimensions",
                  active: showDimensions,
                  toggle: () => setShowDimensions((v) => !v),
                },
              ].map((layer) => (
                <button
                  key={layer.label}
                  onClick={layer.toggle}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    layer.active
                      ? "bg-[#141517] text-white"
                      : "bg-[#F3F1EC] text-[#57534E] hover:text-[#141517]"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative bg-[#FAF9F6] rounded-xl border border-black/8 p-2 sm:p-4 overflow-hidden">
            <svg
              viewBox="-32 -32 464 464"
              className="w-full h-auto max-h-[480px] select-none"
              role="img"
              aria-label={`Architectural blueprint for ${selectedPlan.name}`}
            >
              <defs>
                <pattern
                  id="cadGrid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="rgba(20,21,23,0.045)"
                    strokeWidth="0.7"
                  />
                </pattern>
              </defs>
              <rect x="-32" y="-32" width="464" height="464" fill="url(#cadGrid)" />

              <g transform="translate(396, -12)">
                <circle
                  cx="0"
                  cy="0"
                  r="13"
                  fill="#FFFFFF"
                  stroke="#B45309"
                  strokeWidth="1.2"
                />
                <polygon points="0,-9 -4,4 0,1 4,4" fill="#B45309" />
                <text
                  x="0"
                  y="22"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="600"
                  fill="#141517"
                  fontFamily="JetBrains Mono, monospace"
                >
                  N
                </text>
              </g>

              {selectedPlan.rooms.map((room) => {
                const isRoomSelected = activeRoom?.id === room.id;
                return (
                  <g
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.w}
                      height={room.h}
                      fill={room.fill}
                      stroke={isRoomSelected ? "#B45309" : "#1E293B"}
                      strokeWidth={isRoomSelected ? 2.5 : 1.5}
                    />
                    <text
                      x={room.x + room.w / 2}
                      y={room.y + room.h / 2 - (showDimensions ? 6 : 0)}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="600"
                      fill="#141517"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {room.name}
                    </text>
                    {showDimensions && (
                      <text
                        x={room.x + room.w / 2}
                        y={room.y + room.h / 2 + 9}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#57534E"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {room.dimensionsFt}
                      </text>
                    )}
                  </g>
                );
              })}

              {showMepLines && (
                <g opacity="0.85" pointerEvents="none">
                  <path
                    d="M 325 305 L 325 220 L 205 220 L 205 190"
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <path
                    d="M 45 65 L 45 200 L 325 200 L 325 280"
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="1.5"
                    strokeDasharray="2 3"
                  />
                  <circle cx="325" cy="305" r="4" fill="#0284C7" />
                  <circle cx="45" cy="65" r="4" fill="#DC2626" />
                </g>
              )}

              {showVastuOverlay && (
                <g pointerEvents="none">
                  <rect
                    x="20"
                    y="20"
                    width="360"
                    height="340"
                    fill="none"
                    stroke="rgba(180, 83, 9, 0.35)"
                    strokeWidth="1"
                    strokeDasharray="5 4"
                  />
                  <circle
                    cx="200"
                    cy="190"
                    r="38"
                    fill="rgba(180, 83, 9, 0.06)"
                    stroke="rgba(180, 83, 9, 0.55)"
                    strokeWidth="1.2"
                  />
                  <text
                    x="200"
                    y="193"
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="600"
                    fill="#92400E"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    BRAHMASTHAN
                  </text>
                </g>
              )}

              {showRccGrid && (
                <g pointerEvents="none">
                  {selectedPlan.gridX.map((gx, i) => (
                    <g key={`gx-${gx}`}>
                      <line
                        x1={gx}
                        y1={6}
                        x2={gx}
                        y2={374}
                        stroke="rgba(15, 23, 42, 0.2)"
                        strokeWidth="0.9"
                        strokeDasharray="6 3"
                      />
                      <circle cx={gx} cy={-8} r="8" fill="#141517" />
                      <text
                        x={gx}
                        y={-5}
                        textAnchor="middle"
                        fontSize="7.5"
                        fill="#FFFFFF"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {String.fromCharCode(65 + i)}
                      </text>
                    </g>
                  ))}
                  {selectedPlan.gridY.map((gy, i) => (
                    <g key={`gy-${gy}`}>
                      <line
                        x1={6}
                        y1={gy}
                        x2={394}
                        y2={gy}
                        stroke="rgba(15, 23, 42, 0.2)"
                        strokeWidth="0.9"
                        strokeDasharray="6 3"
                      />
                      <circle cx={-10} cy={gy} r="8" fill="#141517" />
                      <text
                        x={-10}
                        y={gy + 3}
                        textAnchor="middle"
                        fontSize="7.5"
                        fill="#FFFFFF"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {i + 1}
                      </text>
                    </g>
                  ))}
                  {selectedPlan.columns.map((col) => (
                    <rect
                      key={col.id}
                      x={col.x - 4.5}
                      y={col.y - 4.5}
                      width="9"
                      height="9"
                      fill="#141517"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                  ))}
                </g>
              )}
            </svg>
          </div>

          {activeRoom && (
            <div className="mt-4 p-4 rounded-xl bg-[#F8F7F4] border border-black/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#78716C] font-mono tabular-nums">
                  <span>{activeRoom.zone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeRoom.dimensionsFt}</span>
                </div>
                <h4 className="font-semibold text-sm text-[#141517] mt-0.5">
                  {activeRoom.name}
                </h4>
                <p className="text-xs text-[#57534E] mt-0.5">
                  {activeRoom.vastuNote}
                </p>
              </div>
              {activeRoom.isKitchen && (
                <button
                  onClick={() =>
                    onLoadPlanIn3D(selectedPlan, selectedPlan.recommendedLayout)
                  }
                  className="min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#B45309] text-white hover:bg-[#92400E] transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                >
                  Open in Spark Interior Designs
                </button>
              )}
            </div>
          )}
        </div>

        {/* Structural Engineering Schedule & Negotiation Card (NO Villa Prices) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-black/8 p-5">
            <div className="flex items-center justify-between text-xs text-[#78716C] font-mono tabular-nums">
              <span>{selectedPlan.code}</span>
              <span>Plot {selectedPlan.plotSizeFt}</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-[#141517] mt-1">
              {selectedPlan.name}
            </h2>
            <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
              {selectedPlan.summary}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-black/8">
              <div>
                <p className="text-[11px] text-[#78716C]">Built-up Area</p>
                <p className="font-mono text-base font-semibold text-[#141517] tabular-nums">
                  {selectedPlan.areaSqFt.toLocaleString()} sq ft
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#78716C]">Vastu Compliance</p>
                <p className="font-mono text-base font-semibold text-[#92400E] tabular-nums">
                  {selectedPlan.vastuScore}% Aligned
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#78716C]">Slab Thickness</p>
                <p className="font-mono text-base font-semibold text-[#141517] tabular-nums">
                  {selectedPlan.slabThicknessMm} mm RCC
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#78716C]">Commercial Scope</p>
                <p className="text-sm font-semibold text-[#92400E]">
                  Negotiate After Design
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/8 p-5">
            <h3 className="text-sm font-semibold text-[#141517] flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[#B45309]" />
              <span>Civil &amp; Structural Parameters</span>
            </h3>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between gap-4 py-1.5 border-b border-black/6">
                <dt className="text-[#78716C]">Structural Frame</dt>
                <dd className="font-medium text-[#141517] text-right">
                  {selectedPlan.structuralSystem}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-black/6">
                <dt className="text-[#78716C]">Foundation Design</dt>
                <dd className="font-medium text-[#141517] text-right">
                  {selectedPlan.foundationType}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5 border-b border-black/6">
                <dt className="text-[#78716C]">Seismic Rating</dt>
                <dd className="font-medium text-[#141517] text-right">
                  {selectedPlan.seismicZone}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-[#78716C] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Electrical Service</span>
                </dt>
                <dd className="font-mono font-medium text-[#141517] tabular-nums">
                  {selectedPlan.electricalLoadKw} kW · 3-Phase
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-black/8 p-5">
            <h3 className="text-sm font-semibold text-[#141517] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#B45309]" />
              <span>Engineering &amp; Site Notes</span>
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-[#57534E] leading-relaxed">
              {selectedPlan.engineeringHighlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#B45309] font-mono mt-0.5">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onOpenNegotiation}
              className="mt-4 w-full min-h-[44px] rounded-xl bg-[#B45309] text-white text-xs font-semibold hover:bg-[#92400E] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Handshake className="w-4 h-4" />
              <span>Save Build &amp; Negotiate Quote</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Touch-Drag Swatch Badge (Mobile/Tablet) */}
      {touchDragPos && draggedExtFinish && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-full bg-[#141517] text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium border border-white/15"
          style={{ left: touchDragPos.x, top: touchDragPos.y - 16 }}
        >
          <span
            className="w-4 h-4 rounded-full border border-white/40 shrink-0"
            style={{ backgroundColor: draggedExtFinish.hex }}
          />
          <span className="whitespace-nowrap">{draggedExtFinish.name}</span>
        </div>
      )}
    </div>
  );
};
