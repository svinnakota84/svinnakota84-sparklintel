import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Compass,
  Crown,
  DoorOpen,
  GripVertical,
  Handshake,
  Layers,
  Lock,
  Move,
  Palette,
  Plus,
  RotateCw,
  SlidersHorizontal,
  Sofa,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  BACKSPLASH_FINISHES,
  CABINET_COLOR_COMBOS,
  CABINET_FINISHES,
  COUNTERTOP_FINISHES,
  FURNITURE_OPTIONS,
  HARDWARE_FINISHES,
  PLACEABLE_FURNITURE_CATALOG,
} from "../data/catalog";
import {
  CabinetColorCombo,
  CabinetDoorStyle,
  CabinetMaterialSpec,
  CameraPreset,
  ConstructionPlan,
  FurnitureOption,
  InteriorDropZone,
  KitchenLayoutType,
  PlaceableFurnitureSpec,
  PlacedFurnitureInstance,
  SubscriptionTier,
} from "../types";
import { KitchenFurniture3DViewer } from "./KitchenFurniture3DViewer";

type DockTab = "combos" | "custom" | "furniture" | "camera";

interface StudioWorkspaceProps {
  selectedPlan: ConstructionPlan;
  subscriptionTier: SubscriptionTier;
  layout: KitchenLayoutType;
  onChangeLayout: (layout: KitchenLayoutType) => void;
  doorStyle: CabinetDoorStyle;
  onChangeDoorStyle: (style: CabinetDoorStyle) => void;
  activeCombo: CabinetColorCombo;
  onSelectCombo: (combo: CabinetColorCombo) => void;
  upperFinish: CabinetMaterialSpec;
  lowerFinish: CabinetMaterialSpec;
  islandFinish: CabinetMaterialSpec;
  countertopFinish: CabinetMaterialSpec;
  backsplashFinish: CabinetMaterialSpec;
  hardwareFinish: CabinetMaterialSpec;
  onChangeFinish: (
    slot: InteriorDropZone,
    spec: CabinetMaterialSpec
  ) => void;
  diningOption: FurnitureOption;
  stoolOption: FurnitureOption;
  sofaOption: FurnitureOption;
  lightingOption: FurnitureOption;
  onSelectFurniture: (item: FurnitureOption) => void;
  placedFurniture: PlacedFurnitureInstance[];
  selectedFurnitureInstanceId: string | null;
  onSelectPlacedFurniture: (instanceId: string | null) => void;
  onAddPlacedFurniture: (
    spec: PlaceableFurnitureSpec,
    x?: number,
    z?: number
  ) => void;
  onMovePlacedFurniture: (instanceId: string, x: number, z: number) => void;
  onRotatePlacedFurniture: (instanceId: string) => void;
  onRemovePlacedFurniture: (instanceId: string) => void;
  onOpenSubscription: () => void;
  onAskVastuAI: () => void;
  onOpenNegotiation: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  selectedPlan,
  subscriptionTier,
  layout,
  onChangeLayout,
  doorStyle,
  onChangeDoorStyle,
  activeCombo,
  onSelectCombo,
  upperFinish,
  lowerFinish,
  islandFinish,
  countertopFinish,
  backsplashFinish,
  hardwareFinish,
  onChangeFinish,
  diningOption,
  stoolOption,
  sofaOption,
  lightingOption,
  onSelectFurniture,
  placedFurniture,
  selectedFurnitureInstanceId,
  onSelectPlacedFurniture,
  onAddPlacedFurniture,
  onMovePlacedFurniture,
  onRotatePlacedFurniture,
  onRemovePlacedFurniture,
  onOpenSubscription,
  onAskVastuAI,
  onOpenNegotiation,
}) => {
  const [dockExpanded, setDockExpanded] = useState(true);
  const [dockTab, setDockTab] = useState<DockTab>("combos");
  const [customSlot, setCustomSlot] = useState<InteriorDropZone>("lower");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("overview");
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [explodedView, setExplodedView] = useState(0);
  const [showVastuCompass, setShowVastuCompass] = useState(false);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [draggedSpec, setDraggedSpec] = useState<{
    spec: CabinetMaterialSpec;
    naturalSlot: InteriorDropZone;
  } | null>(null);
  const [draggedFurniture, setDraggedFurniture] =
    useState<PlaceableFurnitureSpec | null>(null);
  const [touchDragPos, setTouchDragPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const touchDraggingRef = useRef<{
    spec: CabinetMaterialSpec;
    naturalSlot: InteriorDropZone;
  } | null>(null);
  const touchDraggingFurnitureRef = useRef<PlaceableFurnitureSpec | null>(null);
  const ignoreNextClickRef = useRef(false);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!touchDraggingRef.current && !touchDraggingFurnitureRef.current) {
        return;
      }
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
      const activeFurnDrag = touchDraggingFurnitureRef.current;
      if (activeFurnDrag) {
        touchDraggingFurnitureRef.current = null;
        setTouchDragPos(null);
        window.setTimeout(() => {
          ignoreNextClickRef.current = false;
        }, 120);

        const els = document.elementsFromPoint(e.clientX, e.clientY);
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
          setDraggedFurniture(null);
        }
        return;
      }

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
        const z = zoneBtn.getAttribute("data-zone-drop") as InteriorDropZone;
        if (activeDrag.spec.proOnly && subscriptionTier === "free") {
          setLockNotice(activeDrag.spec.name);
        } else {
          onChangeFinish(z, activeDrag.spec);
        }
        setDraggedSpec(null);
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
        setDraggedSpec(null);
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
  }, [subscriptionTier, onChangeFinish]);

  const startTouchDrag = (
    e: React.PointerEvent,
    spec: CabinetMaterialSpec,
    naturalSlot: InteriorDropZone
  ) => {
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    ignoreNextClickRef.current = true;
    touchDraggingRef.current = { spec, naturalSlot };
    setDraggedSpec({ spec, naturalSlot });
    setTouchDragPos({ x: e.clientX, y: e.clientY });
  };

  const startFurnitureTouchDrag = (
    e: React.PointerEvent,
    spec: PlaceableFurnitureSpec
  ) => {
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    ignoreNextClickRef.current = true;
    touchDraggingFurnitureRef.current = spec;
    setDraggedFurniture(spec);
    setTouchDragPos({ x: e.clientX, y: e.clientY });
  };

  const isSubscribed = subscriptionTier !== "free";

  const promptUpgrade = (label: string) => {
    setLockNotice(label);
  };

  const handle3DZoneSelect = (
    zone: "upper" | "lower" | "island" | "furniture"
  ) => {
    setDockExpanded(true);
    if (zone === "furniture") {
      setDockTab("furniture");
    } else {
      setDockTab("custom");
      setCustomSlot(zone);
    }
  };

  const handleDropOn3DScene = (
    hitZone: "upper" | "lower" | "island" | "countertop" | "backsplash"
  ) => {
    if (!draggedSpec) return;
    const { spec, naturalSlot } = draggedSpec;
    if (spec.proOnly && !isSubscribed) {
      promptUpgrade(spec.name);
      setDraggedSpec(null);
      return;
    }

    // Apply cabinet finishes onto any cabinet zone dropped, or stone/tile to its matching zone
    if (
      naturalSlot === "countertop" ||
      naturalSlot === "backsplash" ||
      naturalSlot === "hardware"
    ) {
      onChangeFinish(naturalSlot, spec);
    } else if (
      hitZone === "upper" ||
      hitZone === "lower" ||
      hitZone === "island"
    ) {
      onChangeFinish(hitZone, spec);
    } else {
      onChangeFinish(customSlot === "upper" || customSlot === "island" ? customSlot : "lower", spec);
    }
    setDraggedSpec(null);
  };

  const activeSlotSpecs: CabinetMaterialSpec[] =
    customSlot === "countertop"
      ? COUNTERTOP_FINISHES
      : customSlot === "backsplash"
      ? BACKSPLASH_FINISHES
      : customSlot === "hardware"
      ? HARDWARE_FINISHES
      : CABINET_FINISHES;

  const activeSlotSelectedId =
    customSlot === "upper"
      ? upperFinish.id
      : customSlot === "lower"
      ? lowerFinish.id
      : customSlot === "island"
      ? islandFinish.id
      : customSlot === "countertop"
      ? countertopFinish.id
      : customSlot === "backsplash"
      ? backsplashFinish.id
      : hardwareFinish.id;

  const selectedPlaced = placedFurniture.find(
    (item) => item.instanceId === selectedFurnitureInstanceId
  );

  const nudgeSelected = (dx: number, dz: number) => {
    if (!selectedPlaced) return;
    const nx = Math.max(-5.8, Math.min(3.1, Number((selectedPlaced.x + dx).toFixed(2))));
    const nz = Math.max(-0.8, Math.min(5.2, Number((selectedPlaced.z + dz).toFixed(2))));
    onMovePlacedFurniture(selectedPlaced.instanceId, nx, nz);
  };

  return (
    <div className="pb-20 md:pb-12">
      {/* Interactive 3D Stage */}
      <div className="relative w-full h-[64dvh] min-h-[450px] md:h-[78dvh] bg-[#EFECE5] overflow-hidden border-b border-black/8">
        <KitchenFurniture3DViewer
          layout={layout}
          doorStyle={doorStyle}
          upperFinish={upperFinish}
          lowerFinish={lowerFinish}
          islandFinish={islandFinish}
          countertopFinish={countertopFinish}
          backsplashFinish={backsplashFinish}
          hardwareFinish={hardwareFinish}
          diningOption={diningOption}
          stoolOption={stoolOption}
          sofaOption={sofaOption}
          lightingOption={lightingOption}
          cameraPreset={cameraPreset}
          doorsOpen={doorsOpen}
          explodedView={explodedView}
          showVastuCompass={showVastuCompass}
          onSelectZone={handle3DZoneSelect}
          draggedSwatchLabel={draggedSpec?.spec.name ?? null}
          onDropAtZone={handleDropOn3DScene}
          placedFurniture={placedFurniture}
          selectedFurnitureInstanceId={selectedFurnitureInstanceId}
          onSelectPlacedFurniture={onSelectPlacedFurniture}
          onMovePlacedFurniture={onMovePlacedFurniture}
          draggedFurnitureName={draggedFurniture?.name ?? null}
          onDropNewFurnitureAt={(x, z) => {
            if (!draggedFurniture) return;
            if (draggedFurniture.proOnly && !isSubscribed) {
              promptUpgrade(draggedFurniture.name);
            } else {
              onAddPlacedFurniture(draggedFurniture, x, z);
            }
            setDraggedFurniture(null);
          }}
        />

        {/* Minimal Top-Left Context Readout */}
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 pointer-events-auto max-w-[calc(100vw-24px)] sm:max-w-md">
          <div className="bg-[#FFFFFF]/95 border border-black/10 rounded-xl px-3.5 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#78716C]">
              <span className="truncate">Spark Interior Designs</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#92400E] font-medium shrink-0">
                {selectedPlan.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 mt-0.5">
              <p className="text-xs sm:text-sm font-semibold text-[#141517] truncate">
                {activeCombo.name} · Drag swatches &amp; furniture in 3D
              </p>
              <button
                onClick={onAskVastuAI}
                className="text-[11px] font-medium text-[#B45309] hover:text-[#92400E] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Vastu AI →
              </button>
            </div>
          </div>
        </div>

        {/* Selected Furniture Micro-Controls (Desktop & Mobile Easy Move/Rotate) */}
        {selectedPlaced && (
          <div className="absolute top-[74px] right-3 sm:top-5 sm:right-5 z-20 pointer-events-auto max-w-[calc(100vw-24px)] sm:max-w-sm bg-white/95 border border-[#B45309]/40 rounded-xl px-3 py-2.5 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-[#B45309] flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  <span>SELECTED IN 3D · DRAG TO MOVE</span>
                </p>
                <p className="text-xs font-semibold text-[#141517] truncate">
                  {selectedPlaced.name}
                </p>
              </div>
              <button
                onClick={() => onSelectPlacedFurniture(null)}
                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#141517] hover:bg-black/5 cursor-pointer"
                aria-label="Done editing furniture"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onRotatePlacedFurniture(selectedPlaced.instanceId)}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#141517] text-white text-[11px] font-medium inline-flex items-center gap-1 hover:bg-[#292B2F] cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>Rotate 45°</span>
              </button>
              <div className="inline-flex items-center gap-1 bg-[#FAF9F6] border border-black/10 rounded-lg p-0.5">
                <button
                  onClick={() => nudgeSelected(-0.4, 0)}
                  className="px-2 py-1 text-[11px] font-mono hover:bg-white rounded cursor-pointer"
                  title="Move Left"
                >
                  ←
                </button>
                <button
                  onClick={() => nudgeSelected(0, -0.4)}
                  className="px-2 py-1 text-[11px] font-mono hover:bg-white rounded cursor-pointer"
                  title="Move Back"
                >
                  ↑
                </button>
                <button
                  onClick={() => nudgeSelected(0, 0.4)}
                  className="px-2 py-1 text-[11px] font-mono hover:bg-white rounded cursor-pointer"
                  title="Move Forward"
                >
                  ↓
                </button>
                <button
                  onClick={() => nudgeSelected(0.4, 0)}
                  className="px-2 py-1 text-[11px] font-mono hover:bg-white rounded cursor-pointer"
                  title="Move Right"
                >
                  →
                </button>
              </div>
              <button
                onClick={() => onRemovePlacedFurniture(selectedPlaced.instanceId)}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium inline-flex items-center gap-1 hover:bg-red-100 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}

        {/* Subscription Lock Prompt */}
        {lockNotice && !isSubscribed && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-md bg-[#141517] text-white rounded-xl p-4 shadow-xl border border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-[#F59E0B] flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Subscription Required</span>
                </p>
                <p className="text-sm font-semibold mt-1">
                  Unlock &ldquo;{lockNotice}&rdquo; &amp; all 3D finishes
                </p>
                <p className="text-xs text-white/75 mt-1">
                  Activate a subscription to unlock all 12 cabinet color
                  combinations, fluted &amp; glass vitrine doors, custom drag
                  swatches, and all 3D furniture suites.
                </p>
              </div>
              <button
                onClick={() => setLockNotice(null)}
                className="text-xs text-white/60 hover:text-white px-2 py-1 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  setLockNotice(null);
                  onOpenSubscription();
                }}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#F59E0B] text-[#141517] font-semibold text-xs hover:bg-[#D97706] hover:text-white transition-colors cursor-pointer"
              >
                View Subscriptions
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Bottom Control Dock */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(960px,95vw)] flex flex-col items-center pointer-events-none">
          <button
            onClick={() => setDockExpanded((v) => !v)}
            className="pointer-events-auto mb-1.5 min-h-[34px] px-4 py-1.5 rounded-t-xl rounded-b-lg bg-[#141517]/92 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-md hover:bg-[#141517] transition-colors cursor-pointer whitespace-nowrap"
          >
            {dockExpanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Drag Colors &amp; 3D Controls</span>
              </>
            )}
          </button>

          {dockExpanded && (
            <div className="pointer-events-auto w-full bg-[#FFFFFF]/96 border border-black/10 rounded-2xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-black/8 bg-[#FAF9F6] overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1">
                  {[
                    {
                      id: "combos" as DockTab,
                      label: "Color Combos",
                      icon: Palette,
                    },
                    {
                      id: "custom" as DockTab,
                      label: "Drag Color Mix",
                      icon: SlidersHorizontal,
                    },
                    {
                      id: "furniture" as DockTab,
                      label: "Furniture",
                      icon: Sofa,
                    },
                    {
                      id: "camera" as DockTab,
                      label: "3D View & Vastu",
                      icon: Camera,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = dockTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setDockTab(tab.id)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          active
                            ? "bg-[#141517] text-white"
                            : "text-[#57534E] hover:text-[#141517] hover:bg-black/5"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {!isSubscribed ? (
                  <button
                    onClick={onOpenSubscription}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#B45309] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-[#92400E] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Unlock All 12 Combos</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-[#92400E] px-2 whitespace-nowrap shrink-0">
                    {subscriptionTier === "studio"
                      ? "Studio Subscribed"
                      : "Pro Subscribed"}
                  </span>
                )}
              </div>

              <div className="p-3 sm:p-4 max-h-[205px] sm:max-h-[250px] overflow-y-auto">
                {dockTab === "combos" && (
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                    {CABINET_COLOR_COMBOS.map((combo) => {
                      const locked = combo.proOnly && !isSubscribed;
                      const selected = activeCombo.id === combo.id;
                      const upperHex =
                        CABINET_FINISHES.find((f) => f.id === combo.upperId)
                          ?.hex ?? "#FFF";
                      const lowerHex =
                        CABINET_FINISHES.find((f) => f.id === combo.lowerId)
                          ?.hex ?? "#333";
                      const stoneHex =
                        COUNTERTOP_FINISHES.find(
                          (f) => f.id === combo.countertopId
                        )?.hex ?? "#EEE";
                      const hwHex =
                        HARDWARE_FINISHES.find((f) => f.id === combo.hardwareId)
                          ?.hex ?? "#AAA";

                      return (
                        <button
                          key={combo.id}
                          onClick={() => {
                            if (locked) {
                              promptUpgrade(combo.name);
                              return;
                            }
                            onSelectCombo(combo);
                          }}
                          className={`shrink-0 w-[205px] text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? "border-[#B45309] bg-[#FAF7F2]"
                              : "border-black/10 bg-white hover:border-black/25"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center -space-x-1">
                              <span
                                className="w-5 h-5 rounded-full border border-black/15"
                                style={{ backgroundColor: upperHex }}
                              />
                              <span
                                className="w-5 h-5 rounded-full border border-black/15"
                                style={{ backgroundColor: lowerHex }}
                              />
                              <span
                                className="w-5 h-5 rounded-full border border-black/15"
                                style={{ backgroundColor: stoneHex }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-black/15"
                                style={{ backgroundColor: hwHex }}
                              />
                            </div>
                            {locked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#92400E]">
                                <Lock className="w-3 h-3" />
                                PRO
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-[#57534E]">
                                {combo.doorStyle.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#141517] mt-2 truncate">
                            {combo.name}
                          </p>
                          <p className="text-[11px] text-[#57534E] truncate mt-0.5">
                            {combo.vastuElement}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {dockTab === "custom" && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-[#F3F1EC] p-1 rounded-lg">
                        {(
                          [
                            { id: "l-island", label: "L-Island" },
                            { id: "galley", label: "Galley" },
                            { id: "u-chef", label: "U-Chef" },
                          ] as { id: KitchenLayoutType; label: string }[]
                        ).map((l) => {
                          const locked = l.id !== "l-island" && !isSubscribed;
                          return (
                            <button
                              key={l.id}
                              onClick={() => {
                                if (locked) {
                                  promptUpgrade(`${l.label} 3D Layout`);
                                  return;
                                }
                                onChangeLayout(l.id);
                              }}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                layout === l.id
                                  ? "bg-white text-[#141517] shadow-sm"
                                  : "text-[#57534E]"
                              }`}
                            >
                              {locked && <Lock className="w-2.5 h-2.5" />}
                              <span>{l.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1 bg-[#F3F1EC] p-1 rounded-lg">
                        {(
                          [
                            { id: "shaker", label: "Shaker", pro: false },
                            { id: "slab", label: "Slab", pro: false },
                            { id: "fluted", label: "Fluted", pro: true },
                            { id: "vitrine", label: "Vitrine", pro: true },
                          ] as {
                            id: CabinetDoorStyle;
                            label: string;
                            pro: boolean;
                          }[]
                        ).map((d) => {
                          const locked = d.pro && !isSubscribed;
                          return (
                            <button
                              key={d.id}
                              onClick={() => {
                                if (locked) {
                                  promptUpgrade(`${d.label} Cabinet Doors`);
                                  return;
                                }
                                onChangeDoorStyle(d.id);
                              }}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                doorStyle === d.id
                                  ? "bg-white text-[#141517] shadow-sm"
                                  : "text-[#57534E]"
                              }`}
                            >
                              {locked && <Lock className="w-2.5 h-2.5" />}
                              <span>{d.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Zone Drop Targets (Tap OR Drag Swatch onto any Zone!) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {(
                        [
                          { id: "upper", label: "Upper Cabinets" },
                          { id: "lower", label: "Lower Cabinets" },
                          { id: "island", label: "Island Base" },
                          { id: "countertop", label: "Countertop" },
                          { id: "backsplash", label: "Backsplash" },
                          { id: "hardware", label: "Hardware" },
                        ] as const
                      ).map((s) => (
                        <button
                          key={s.id}
                          data-zone-drop={s.id}
                          onClick={() => setCustomSlot(s.id)}
                          onDragOver={(e) => {
                            if (draggedSpec) e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!draggedSpec) return;
                            if (draggedSpec.spec.proOnly && !isSubscribed) {
                              promptUpgrade(draggedSpec.spec.name);
                            } else {
                              onChangeFinish(s.id, draggedSpec.spec);
                            }
                            setDraggedSpec(null);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                            draggedSpec
                              ? "border-dashed border-[#B45309] bg-[#FAF7F2] text-[#92400E]"
                              : customSlot === s.id
                              ? "border-[#B45309] bg-[#FAF7F2] text-[#92400E]"
                              : "border-black/10 bg-white text-[#57534E]"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Draggable Color Swatches */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {activeSlotSpecs.map((spec) => {
                        const locked = spec.proOnly && !isSubscribed;
                        const active = activeSlotSelectedId === spec.id;
                        return (
                          <button
                            key={spec.id}
                            draggable
                            onDragStart={() =>
                              setDraggedSpec({ spec, naturalSlot: customSlot })
                            }
                            onDragEnd={() => setDraggedSpec(null)}
                            onClick={() => {
                              if (ignoreNextClickRef.current) {
                                ignoreNextClickRef.current = false;
                                return;
                              }
                              if (locked) {
                                promptUpgrade(spec.name);
                                return;
                              }
                              onChangeFinish(customSlot, spec);
                            }}
                            title="Drag handle onto 3D kitchen or tap to apply"
                            className={`shrink-0 min-h-[44px] px-2.5 py-1.5 rounded-xl border inline-flex items-center gap-2 transition-all cursor-grab active:cursor-grabbing ${
                              active
                                ? "border-[#B45309] bg-[#FAF7F2]"
                                : "border-black/10 bg-white hover:border-black/25"
                            }`}
                          >
                            <span
                              onPointerDown={(e) =>
                                startTouchDrag(e, spec, customSlot)
                              }
                              className="touch-none inline-flex items-center justify-center p-1 -ml-1 text-[#78716C]"
                              aria-label={`Drag ${spec.name}`}
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                            <span
                              className="w-6 h-6 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: spec.hex }}
                            />
                            <span className="text-[11px] font-medium text-[#141517] whitespace-nowrap inline-flex items-center gap-1">
                              <span>{spec.name}</span>
                              {locked && (
                                <Lock className="w-3 h-3 text-[#B45309]" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {dockTab === "furniture" && (
                  <div className="space-y-3">
                    {/* Add & Drag Designer Collection (Sophia Key & George Buildings) */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <p className="text-[11px] font-semibold text-[#141517]">
                          Add &amp; Drag Designer Furniture (Sophia Key &amp; George Collection)
                        </p>
                        <span className="text-[10px] font-mono text-[#78716C]">
                          Tap &ldquo;+ Add&rdquo; or drag onto 3D floor · Drag items inside room to reposition
                        </span>
                      </div>

                      <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-1">
                        {PLACEABLE_FURNITURE_CATALOG.map((item) => {
                          const locked = item.proOnly && !isSubscribed;
                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => setDraggedFurniture(item)}
                              onDragEnd={() => setDraggedFurniture(null)}
                              className="shrink-0 w-[215px] rounded-xl border border-black/10 bg-[#FAF9F6] hover:border-[#B45309] p-2 flex flex-col justify-between gap-1.5 transition-colors cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    onPointerDown={(e) =>
                                      startFurnitureTouchDrag(e, item)
                                    }
                                    className="touch-none inline-flex items-center justify-center p-1 -ml-1 text-[#78716C] shrink-0"
                                    aria-label={`Drag ${item.name} into 3D room`}
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </span>
                                  <span
                                    className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                                    style={{ backgroundColor: item.primaryHex }}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-[#141517] truncate">
                                      {item.name}
                                    </p>
                                    <p className="text-[10px] text-[#78716C] truncate">
                                      {item.collection} · {item.dimensions}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <span className="text-[10px] text-[#57534E] truncate">
                                  {item.materialNote}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (ignoreNextClickRef.current) {
                                      ignoreNextClickRef.current = false;
                                      return;
                                    }
                                    if (locked) {
                                      promptUpgrade(item.name);
                                      return;
                                    }
                                    onAddPlacedFurniture(item);
                                  }}
                                  className={`shrink-0 min-h-[28px] px-2 py-1 rounded-lg text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                                    locked
                                      ? "bg-[#EFECE6] text-[#92400E]"
                                      : "bg-[#141517] text-white hover:bg-[#B45309]"
                                  }`}
                                >
                                  {locked ? (
                                    <>
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>PRO</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>Add</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* In-Room Placed Chips */}
                    {placedFurniture.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-black/8">
                        <span className="text-[10px] font-mono text-[#78716C] shrink-0">
                          IN 3D ROOM ({placedFurniture.length}):
                        </span>
                        {placedFurniture.map((inst) => {
                          const isSel =
                            inst.instanceId === selectedFurnitureInstanceId;
                          return (
                            <button
                              key={inst.instanceId}
                              onClick={() =>
                                onSelectPlacedFurniture(
                                  isSel ? null : inst.instanceId
                                )
                              }
                              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium border inline-flex items-center gap-1.5 cursor-pointer ${
                                isSel
                                  ? "border-[#B45309] bg-[#FAF7F2] text-[#92400E]"
                                  : "border-black/10 bg-white text-[#57534E]"
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/15"
                                style={{ backgroundColor: inst.primaryHex }}
                              />
                              <span>{inst.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Room Base Suites */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-black/8">
                      {(
                        [
                          {
                            key: "dining",
                            title: "Base Dining Suite",
                            activeId: diningOption.id,
                          },
                          {
                            key: "stools",
                            title: "Island Stools",
                            activeId: stoolOption.id,
                          },
                          {
                            key: "sofa",
                            title: "Base Lounge Sofa",
                            activeId: sofaOption.id,
                          },
                          {
                            key: "lighting",
                            title: "Pendant Lighting",
                            activeId: lightingOption.id,
                          },
                        ] as const
                      ).map((cat) => {
                        const items = FURNITURE_OPTIONS.filter(
                          (f) => f.category === cat.key
                        );
                        return (
                          <div
                            key={cat.key}
                            className="rounded-xl border border-black/8 bg-[#FAF9F6] p-2"
                          >
                            <p className="text-[11px] font-semibold text-[#57534E] mb-1">
                              {cat.title}
                            </p>
                            <div className="space-y-1">
                              {items.map((item) => {
                                const locked = item.proOnly && !isSubscribed;
                                const isSelected = cat.activeId === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => {
                                      if (locked) {
                                        promptUpgrade(item.name);
                                        return;
                                      }
                                      onSelectFurniture(item);
                                    }}
                                    className={`w-full text-left px-2 py-1 rounded-lg border text-[11px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                      isSelected
                                        ? "bg-white border-[#B45309] font-semibold text-[#141517]"
                                        : "bg-white/70 border-black/8 text-[#57534E] hover:bg-white"
                                    }`}
                                  >
                                    <span className="inline-flex items-center gap-1.5 truncate">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                                        style={{
                                          backgroundColor: item.primaryHex,
                                        }}
                                      />
                                      <span className="truncate">{item.name}</span>
                                    </span>
                                    {locked && (
                                      <Lock className="w-3 h-3 text-[#B45309] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {dockTab === "camera" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: "overview", label: "Overview" },
                          { id: "island", label: "Island Close-up" },
                          { id: "cabinets", label: "Cabinets" },
                          { id: "living", label: "Dining & Sofa" },
                          { id: "top", label: "Top Plan" },
                        ] as { id: CameraPreset; label: string }[]
                      ).map((cam) => (
                        <button
                          key={cam.id}
                          onClick={() => setCameraPreset(cam.id)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            cameraPreset === cam.id
                              ? "bg-[#141517] text-white"
                              : "bg-[#F3F1EC] text-[#57534E] hover:text-[#141517]"
                          }`}
                        >
                          {cam.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setDoorsOpen((v) => !v)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                          doorsOpen
                            ? "bg-[#B45309] text-white border-[#B45309]"
                            : "bg-white text-[#141517] border-black/15"
                        }`}
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>{doorsOpen ? "Close Doors" : "Open Doors"}</span>
                      </button>

                      <button
                        onClick={() => setShowVastuCompass((v) => !v)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                          showVastuCompass
                            ? "bg-[#B45309] text-white border-[#B45309]"
                            : "bg-white text-[#141517] border-black/15"
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Vastu Compass</span>
                      </button>

                      <label className="inline-flex items-center gap-2 text-xs text-[#57534E]">
                        <Layers className="w-3.5 h-3.5 text-[#B45309]" />
                        <span className="whitespace-nowrap">Explode</span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.02}
                          value={explodedView}
                          onChange={(e) =>
                            setExplodedView(Number(e.target.value))
                          }
                          className="w-24 accent-[#B45309] cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Spark Interior Designs Specification & Negotiation Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-black/8">
          <div>
            <p className="text-xs font-mono text-[#B45309]">
              Detailed Interior Specification · No Fixed Sticker Pricing
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#141517] mt-1">
              Spark Interior Designs — Active Material &amp; Furniture Schedule
            </h1>
            <p className="text-sm text-[#57534E] mt-1 max-w-2xl">
              Drag any finish swatch directly onto the 3D cabinets, island,
              stone countertop, or backsplash above. Once you love your custom
              interior, request a 1-on-1 price negotiation.
            </p>
          </div>
          <button
            onClick={onOpenNegotiation}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#B45309] text-white text-xs font-semibold hover:bg-[#92400E] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Handshake className="w-4 h-4" />
            <span>Like This Design? Negotiate Quote</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 6-Part Cabinetry & Surface Schedule */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-black/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#141517]">
                Cabinetry &amp; Surface Finishes
              </h2>
              <span className="text-xs font-mono text-[#78716C]">
                Layout: {layout.toUpperCase()} · Door: {doorStyle.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Upper Cabinets", spec: upperFinish, slot: "upper" as const },
                { label: "Lower Base Cabinets", spec: lowerFinish, slot: "lower" as const },
                { label: "Waterfall Island", spec: islandFinish, slot: "island" as const },
                { label: "Countertop Stone", spec: countertopFinish, slot: "countertop" as const },
                { label: "Backsplash Surface", spec: backsplashFinish, slot: "backsplash" as const },
                { label: "Hardware & Faucet", spec: hardwareFinish, slot: "hardware" as const },
              ].map((entry) => (
                <button
                  key={entry.label}
                  onClick={() => {
                    setDockExpanded(true);
                    setDockTab("custom");
                    setCustomSlot(entry.slot);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left p-3.5 rounded-xl border border-black/8 bg-[#FAF9F6] hover:border-[#B45309] transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <span
                    className="w-9 h-9 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: entry.spec.hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-[#78716C]">
                      {entry.label}
                    </p>
                    <p className="text-sm font-semibold text-[#141517] truncate">
                      {entry.spec.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Furniture & Lighting Suite */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-black/8 p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#141517] mb-4">
                Selected Furniture &amp; Lighting Suite
              </h2>
              <div className="space-y-3">
                {[diningOption, stoolOption, sofaOption, lightingOption].map(
                  (item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#FAF9F6] border border-black/8 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 mt-0.5 shrink-0"
                          style={{ backgroundColor: item.primaryHex }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#141517]">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[#57534E] mt-0.5">
                            {item.materialNote}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#78716C] shrink-0 tabular-nums">
                        {item.dimensions}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-black/8 flex items-center justify-between gap-3">
              <p className="text-xs text-[#57534E]">
                + {placedFurniture.length} custom placed Sophia Key / George pieces · Pricing negotiated 1-on-1.
              </p>
              <button
                onClick={onOpenNegotiation}
                className="text-xs font-semibold text-[#B45309] hover:text-[#92400E] whitespace-nowrap cursor-pointer"
              >
                Negotiate Now →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Touch-Drag Swatch or Furniture Badge (Mobile/Tablet) */}
      {touchDragPos && (draggedSpec || draggedFurniture) && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-full bg-[#141517] text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium border border-white/15"
          style={{ left: touchDragPos.x, top: touchDragPos.y - 16 }}
        >
          <span
            className="w-4 h-4 rounded-full border border-white/40 shrink-0"
            style={{
              backgroundColor:
                draggedFurniture?.primaryHex ?? draggedSpec?.spec.hex,
            }}
          />
          <span className="whitespace-nowrap">
            {draggedFurniture
              ? `Drop ${draggedFurniture.name} on Floor`
              : draggedSpec?.spec.name}
          </span>
        </div>
      )}
    </div>
  );
};
