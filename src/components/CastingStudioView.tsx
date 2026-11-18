import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  Crown,
  Eye,
  GripVertical,
  Handshake,
  Home,
  Layers,
  Lock,
  Sofa,
} from "lucide-react";
import {
  CASTING_FINISHES,
  CASTING_PROJECT_PRESETS,
  CASTING_SYSTEMS,
} from "../data/catalog";
import {
  BuildingSector,
  CastingDropZone,
  CastingFacadeProfile,
  CastingGlazingStyle,
  CastingMaterialSpec,
  CastingMethodId,
  CastingProjectPreset,
  SubscriptionTier,
} from "../types";
import { Casting3DViewer } from "./Casting3DViewer";

interface CastingStudioViewProps {
  subscriptionTier: SubscriptionTier;
  onOpenPricing: () => void;
  sector: BuildingSector;
  onChangeSector: (sector: BuildingSector) => void;
  methodId: CastingMethodId;
  onChangeMethodId: (id: CastingMethodId) => void;
  facadeProfile: CastingFacadeProfile;
  onChangeFacadeProfile: (profile: CastingFacadeProfile) => void;
  glazingStyle: CastingGlazingStyle;
  onChangeGlazingStyle: (style: CastingGlazingStyle) => void;
  floors: number;
  onChangeFloors: (floors: number) => void;
  bays: number;
  onChangeBays: (bays: number) => void;
  concreteFinish: CastingMaterialSpec;
  shellAccentFinish: CastingMaterialSpec;
  mullionFinish: CastingMaterialSpec;
  lobbyInteriorFinish: CastingMaterialSpec;
  onChangeCastFinish: (zone: CastingDropZone, spec: CastingMaterialSpec) => void;
  onApplyPreset: (preset: CastingProjectPreset) => void;
  onOpenNegotiation: () => void;
}

export const CastingStudioView: React.FC<CastingStudioViewProps> = ({
  subscriptionTier,
  onOpenPricing,
  sector,
  onChangeSector,
  methodId,
  onChangeMethodId,
  facadeProfile,
  onChangeFacadeProfile,
  glazingStyle,
  onChangeGlazingStyle,
  floors,
  onChangeFloors,
  bays,
  onChangeBays,
  concreteFinish,
  shellAccentFinish,
  mullionFinish,
  lobbyInteriorFinish,
  onChangeCastFinish,
  onApplyPreset,
  onOpenNegotiation,
}) => {
  const [xrayMode, setXrayMode] = useState(false);
  const [activeZone, setActiveZone] = useState<CastingDropZone>("concrete");
  const [draggedFinish, setDraggedFinish] =
    useState<CastingMaterialSpec | null>(null);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [touchDragPos, setTouchDragPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const touchDraggingRef = useRef<CastingMaterialSpec | null>(null);
  const ignoreNextClickRef = useRef(false);

  const isSubscribed = subscriptionTier !== "free";

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!touchDraggingRef.current) return;
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
      const activeDrag = touchDraggingRef.current;
      if (!activeDrag) return;
      touchDraggingRef.current = null;
      setTouchDragPos(null);
      window.setTimeout(() => {
        ignoreNextClickRef.current = false;
      }, 120);

      const els = document.elementsFromPoint(e.clientX, e.clientY);
      const zoneBtn = els.find((el) =>
        el.hasAttribute("data-zone-drop")
      ) as HTMLElement | undefined;

      if (zoneBtn) {
        const z = zoneBtn.getAttribute("data-zone-drop") as CastingDropZone;
        if (activeDrag.proOnly && subscriptionTier === "free") {
          setLockNotice(activeDrag.name);
        } else {
          onChangeCastFinish(z, activeDrag);
        }
        setDraggedFinish(null);
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
        setDraggedFinish(null);
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
  }, [subscriptionTier, onChangeCastFinish]);

  const startTouchDrag = (
    e: React.PointerEvent,
    spec: CastingMaterialSpec
  ) => {
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    ignoreNextClickRef.current = true;
    touchDraggingRef.current = spec;
    setDraggedFinish(spec);
    setTouchDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleApplyFinish = (
    zone: CastingDropZone,
    spec: CastingMaterialSpec
  ) => {
    if (spec.proOnly && !isSubscribed) {
      setLockNotice(spec.name);
      setDraggedFinish(null);
      return;
    }
    onChangeCastFinish(zone, spec);
    setDraggedFinish(null);
  };

  const activeSystem =
    CASTING_SYSTEMS.find((s) => s.id === methodId) ?? CASTING_SYSTEMS[0];
  const zoneFinishes = CASTING_FINISHES.filter((f) => f.zone === activeZone);
  const currentZoneSpec =
    activeZone === "concrete"
      ? concreteFinish
      : activeZone === "shellAccent"
      ? shellAccentFinish
      : activeZone === "mullions"
      ? mullionFinish
      : lobbyInteriorFinish;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-14 space-y-8">
      {/* Header Banner Communicating Commercial & Residential Capabilities */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-black/8">
        <div>
          <p className="text-xs font-mono text-[#B45309] tracking-wide">
            Any Kind of Building Casting · Commercial Towers &amp; Custom
            Residences
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#141517] mt-1">
            3D Architectural Casting &amp; Structural Design Studio
          </h1>
          <p className="text-sm text-[#57534E] mt-1.5 max-w-3xl leading-relaxed">
            Spark&amp;Lintel Design-Builders executes every type of building
            casting—from monolithic RCC villas, GFRC sculptural arches, and
            waffle-slab pavilions to multi-story commercial precast towers and
            post-tensioned showrooms. Configure your 3D structure below, pair
            full-height glazing and sculptural furniture staging, and negotiate
            1-on-1 after finalizing your design.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex rounded-xl border border-black/12 bg-white p-1">
            <button
              onClick={() => onChangeSector("residential")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                sector === "residential"
                  ? "bg-[#141517] text-white"
                  : "text-[#57534E] hover:text-[#141517]"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Residential</span>
            </button>
            <button
              onClick={() => onChangeSector("commercial")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                sector === "commercial"
                  ? "bg-[#141517] text-white"
                  : "text-[#57534E] hover:text-[#141517]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Commercial</span>
            </button>
          </div>

          <button
            onClick={onOpenNegotiation}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl bg-[#B45309] text-white hover:bg-[#92400E] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Handshake className="w-4 h-4" />
            <span>Negotiate Casting Build</span>
          </button>
        </div>
      </div>

      {/* Main 3D Structure Configurator + Material Drag-Drop Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 cols: 3D Casting Viewport & Structural Geometry Controls */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-black/8 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-black/8 flex flex-wrap items-center justify-between gap-2 bg-[#FAF9F6]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#141517]">
              <Layers className="w-4 h-4 text-[#B45309]" />
              <span>
                {sector === "commercial"
                  ? "Commercial Building Casting"
                  : "Residential Building Casting"}{" "}
                · {activeSystem.name} ({floors}F × {bays} Bays)
              </span>
            </div>
            <button
              onClick={() => setXrayMode((v) => !v)}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                xrayMode
                  ? "bg-[#B45309] text-white border-[#B45309]"
                  : "bg-white text-[#141517] border-black/15"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {xrayMode ? "Structural X-Ray On" : "Inspect Cast Skeleton"}
              </span>
            </button>
          </div>

          <div className="relative h-[340px] sm:h-[490px] w-full">
            <Casting3DViewer
              sector={sector}
              methodId={methodId}
              facadeProfile={facadeProfile}
              glazingStyle={glazingStyle}
              floors={floors}
              bays={bays}
              xrayMode={xrayMode}
              concreteFinish={concreteFinish}
              shellAccentFinish={shellAccentFinish}
              mullionFinish={mullionFinish}
              lobbyInteriorFinish={lobbyInteriorFinish}
              draggedFinish={draggedFinish}
              onDropFinish={handleApplyFinish}
            />

            {lockNotice && !isSubscribed && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm bg-[#141517] text-white rounded-xl p-4 shadow-xl">
                <p className="text-xs font-mono text-[#F59E0B] flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Subscription Casting System</span>
                </p>
                <p className="text-sm font-semibold mt-1">
                  Unlock &ldquo;{lockNotice}&rdquo; for commercial &amp; custom
                  3D builds
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

          {/* 3D Structure Geometry Controls */}
          <div className="p-4 border-t border-black/8 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[#57534E] mb-1.5">
                <span>Building Levels</span>
                <span className="font-mono font-semibold text-[#141517] tabular-nums">
                  {floors} {floors === 1 ? "Floor" : "Floors"}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={floors}
                onChange={(e) => onChangeFloors(Number(e.target.value))}
                className="w-full accent-[#B45309] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[#57534E] mb-1.5">
                <span>Structural Bays</span>
                <span className="font-mono font-semibold text-[#141517] tabular-nums">
                  {bays} Bays
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={4}
                step={1}
                value={bays}
                onChange={(e) => onChangeBays(Number(e.target.value))}
                className="w-full accent-[#B45309] cursor-pointer"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-[#57534E] mb-1.5">
                Cast Facade Form
              </p>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    { id: "cantilever", label: "Cantilever" },
                    { id: "arched-gfrc", label: "GFRC Arch" },
                    { id: "brise-soleil", label: "Solar Fins" },
                    { id: "folded-shell", label: "Folded Shell" },
                  ] as { id: CastingFacadeProfile; label: string }[]
                ).map((fp) => (
                  <button
                    key={fp.id}
                    onClick={() => onChangeFacadeProfile(fp.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer truncate ${
                      facadeProfile === fp.id
                        ? "bg-[#141517] text-white border-[#141517]"
                        : "bg-[#FAF9F6] text-[#57534E] border-black/10"
                    }`}
                  >
                    {fp.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#57534E] mb-1.5">
                Glazing Envelope
              </p>
              <div className="space-y-1">
                {(
                  [
                    { id: "slim-black", label: "Slim Black Curtain" },
                    { id: "arched-bronze", label: "Arched Bronze Frame" },
                    { id: "ribbon-curtain", label: "Panoramic Low-E" },
                  ] as { id: CastingGlazingStyle; label: string }[]
                ).map((gl) => (
                  <button
                    key={gl.id}
                    onClick={() => onChangeGlazingStyle(gl.id)}
                    className={`w-full text-left px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer truncate ${
                      glazingStyle === gl.id
                        ? "bg-[#FAF7F2] text-[#92400E] border-[#B45309]"
                        : "bg-[#FAF9F6] text-[#57534E] border-black/10"
                    }`}
                  >
                    {gl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Drag-and-Drop Cast Surfaces & Interior Staging */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-black/8 p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-[#B45309]">
                Drag-and-Drop 3D Material Studio
              </p>
              <h2 className="font-display text-xl font-semibold text-[#141517] mt-0.5">
                Cast Concrete, Shell &amp; Lobby
              </h2>
              <p className="text-xs text-[#57534E] mt-1">
                Drag any cast aggregate, sculptural GFRC, slim mullion, or
                designer furniture palette directly onto the 3D building.
              </p>
            </div>

            {/* 4 Cast Target Zones */}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: "concrete",
                    label: "Cast Structure",
                    spec: concreteFinish,
                  },
                  {
                    id: "shellAccent",
                    label: "Shell & Arches",
                    spec: shellAccentFinish,
                  },
                  {
                    id: "mullions",
                    label: "Glazing Frames",
                    spec: mullionFinish,
                  },
                  {
                    id: "lobbyInterior",
                    label: "Interior Staging",
                    spec: lobbyInteriorFinish,
                  },
                ] as const
              ).map((z) => {
                const active = activeZone === z.id;
                return (
                  <button
                    key={z.id}
                    data-zone-drop={z.id}
                    onClick={() => setActiveZone(z.id)}
                    onDragOver={(e) => {
                      if (draggedFinish) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedFinish) {
                        handleApplyFinish(z.id, draggedFinish);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      draggedFinish
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

            {/* Swatches for Active Cast Zone */}
            <div className="space-y-2 pt-2 border-t border-black/8">
              <p className="text-xs font-medium text-[#57534E]">
                Available Finishes ({zoneFinishes.length})
              </p>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {zoneFinishes.map((spec) => {
                  const locked = spec.proOnly && !isSubscribed;
                  const isSelected = currentZoneSpec.id === spec.id;
                  return (
                    <button
                      key={spec.id}
                      draggable
                      onDragStart={() => setDraggedFinish(spec)}
                      onDragEnd={() => setDraggedFinish(null)}
                      onClick={() => {
                        if (ignoreNextClickRef.current) {
                          ignoreNextClickRef.current = false;
                          return;
                        }
                        handleApplyFinish(activeZone, spec);
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
            <div className="rounded-xl bg-[#FAF9F6] border border-black/8 p-3 text-xs text-[#57534E]">
              <p className="font-semibold text-[#141517]">
                {activeSystem.name} · {activeSystem.maxSpanFt}
              </p>
              <p className="mt-0.5 leading-relaxed">
                {activeSystem.engineeringNote}
              </p>
            </div>
            <button
              onClick={onOpenNegotiation}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#141517] text-white text-xs font-semibold hover:bg-[#292B2F] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Handshake className="w-4 h-4 text-[#F59E0B]" />
              <span>Save 3D Structure &amp; Negotiate Quote</span>
            </button>
          </div>
        </div>
      </div>

      {/* All 8 Building Casting Systems (Residential & Commercial) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-[#B45309]">
              Full-Spectrum Structural &amp; Architectural Casting
            </p>
            <h2 className="font-display text-2xl font-semibold text-[#141517]">
              Choose Any Casting Method for Commercial or Residential Buildings
            </h2>
          </div>
          <span className="text-xs text-[#57534E]">
            Custom formwork engineering · No fixed sticker pricing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CASTING_SYSTEMS.map((sys) => {
            const locked = sys.proOnly && !isSubscribed;
            const selected = methodId === sys.id;
            return (
              <button
                key={sys.id}
                onClick={() => {
                  if (locked) {
                    setLockNotice(sys.name);
                    return;
                  }
                  onChangeMethodId(sys.id);
                }}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selected
                    ? "border-[#B45309] bg-white shadow-sm"
                    : "border-black/8 bg-white/80 hover:bg-white hover:border-black/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#78716C]">
                    <span>{sys.sectors.map((s) => s.toUpperCase()).join(" + ")}</span>
                    {locked ? (
                      <span className="inline-flex items-center gap-1 text-[#92400E]">
                        <Lock className="w-3 h-3" />
                        PRO
                      </span>
                    ) : (
                      <span className="text-[#92400E] font-medium">
                        {sys.maxSpanFt}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[#141517] mt-1.5">
                    {sys.name}
                  </h3>
                  <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                    {sys.tagline}
                  </p>
                </div>
                <p className="text-[11px] text-[#78716C] mt-3 pt-2.5 border-t border-black/6">
                  Best for: {sys.idealUse}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Curated Commercial & Residential Casting + Envelope + Sculptural Furniture Showcases */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-mono text-[#B45309]">
            Turnkey Building Casting + Slim Glazing + Sculptural Furniture
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#141517]">
            Commercial &amp; Residential Complete 3D Structure Presets
          </h2>
          <p className="text-sm text-[#57534E] mt-1 max-w-3xl">
            Combine our structural casting with slim thermal-break curtain
            glazing, custom joinery packages, and sculptural travertine,
            bouclé, and fluted-timber furniture suites. Click any preset to
            load its 3D structure immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CASTING_PROJECT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="bg-white rounded-2xl border border-black/8 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-[#B45309] font-semibold">
                    {preset.sector === "commercial"
                      ? "COMMERCIAL COMPLEX"
                      : "RESIDENTIAL VILLA"}
                  </span>
                  <span className="text-[#78716C] tabular-nums">
                    {preset.floors} Floors · {preset.bays} Bays
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-[#141517]">
                  {preset.name}
                </h3>
                <div className="space-y-1.5 text-xs text-[#57534E]">
                  <p>
                    <strong className="text-[#141517]">
                      Architectural Envelope:
                    </strong>{" "}
                    {preset.envelopeInspiration}
                  </p>
                  <p className="flex items-start gap-1.5">
                    <Sofa className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#141517]">
                        Sculptural Furniture Pairing:
                      </strong>{" "}
                      {preset.furniturePairing}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/8">
                <button
                  onClick={() => onApplyPreset(preset)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#141517] text-white text-xs font-semibold hover:bg-[#292B2F] transition-colors cursor-pointer"
                >
                  Load 3D Casting Structure
                </button>
                <button
                  onClick={() => {
                    onApplyPreset(preset);
                    onOpenNegotiation();
                  }}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#B45309] text-[#92400E] text-xs font-semibold hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Negotiate Package →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Touch-Drag Swatch Badge (Mobile/Tablet) */}
      {touchDragPos && draggedFinish && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-full bg-[#141517] text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium border border-white/15"
          style={{ left: touchDragPos.x, top: touchDragPos.y - 16 }}
        >
          <span
            className="w-4 h-4 rounded-full border border-white/40 shrink-0"
            style={{ backgroundColor: draggedFinish.hex }}
          />
          <span className="whitespace-nowrap">{draggedFinish.name}</span>
        </div>
      )}
    </div>
  );
};
