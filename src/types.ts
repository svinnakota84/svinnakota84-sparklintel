export type AppTab = "studio" | "plans" | "casting" | "advisor" | "pricing";

export type BuildingSector = "residential" | "commercial";

export type CastingMethodId =
  | "monolithic-rcc"
  | "precast-panels"
  | "gfrc-sculptural"
  | "post-tension-slab"
  | "waffle-coffered"
  | "cantilever-shell"
  | "precast-frame"
  | "tilt-up-hybrid";

export type CastingFacadeProfile =
  | "cantilever"
  | "arched-gfrc"
  | "brise-soleil"
  | "folded-shell";

export type CastingGlazingStyle =
  | "slim-black"
  | "arched-bronze"
  | "ribbon-curtain";

export type CastingDropZone =
  | "concrete"
  | "shellAccent"
  | "mullions"
  | "lobbyInterior";

export interface CastingSystemSpec {
  id: CastingMethodId;
  name: string;
  tagline: string;
  sectors: BuildingSector[];
  maxSpanFt: string;
  idealUse: string;
  engineeringNote: string;
  proOnly: boolean;
}

export interface CastingMaterialSpec {
  id: string;
  name: string;
  zone: CastingDropZone;
  hex: string;
  secondaryHex?: string;
  roughness: number;
  metalness: number;
  isWood?: boolean;
  isStone?: boolean;
  isFluted?: boolean;
  proOnly: boolean;
}

export interface CastingProjectPreset {
  id: string;
  name: string;
  sector: BuildingSector;
  methodId: CastingMethodId;
  facadeProfile: CastingFacadeProfile;
  glazingStyle: CastingGlazingStyle;
  floors: number;
  bays: number;
  concreteId: string;
  shellAccentId: string;
  mullionsId: string;
  lobbyInteriorId: string;
  envelopeInspiration: string;
  furniturePairing: string;
}

export type SubscriptionTier = "free" | "pro" | "studio";

export type CabinetDoorStyle = "shaker" | "slab" | "fluted" | "vitrine";

export type KitchenLayoutType = "l-island" | "galley" | "u-chef";

export type CameraPreset =
  | "overview"
  | "island"
  | "cabinets"
  | "living"
  | "top";

export type InteriorDropZone =
  | "upper"
  | "lower"
  | "island"
  | "countertop"
  | "backsplash"
  | "hardware";

export type ExteriorDropZone = "facade" | "cladding" | "timber" | "roofTrim";

export interface CabinetMaterialSpec {
  id: string;
  name: string;
  category: "matte" | "wood" | "lacquer" | "stone" | "metal" | "tile";
  hex: string;
  secondaryHex?: string;
  roughness: number;
  metalness: number;
  isWood?: boolean;
  isMarble?: boolean;
  isFluted?: boolean;
  proOnly: boolean;
}

export interface ExteriorMaterialSpec {
  id: string;
  name: string;
  zone: ExteriorDropZone;
  hex: string;
  secondaryHex?: string;
  roughness: number;
  metalness: number;
  isWood?: boolean;
  isStone?: boolean;
  proOnly: boolean;
}

export interface CabinetColorCombo {
  id: string;
  name: string;
  subtitle: string;
  vastuElement: string;
  proOnly: boolean;
  upperId: string;
  lowerId: string;
  islandId: string;
  countertopId: string;
  backsplashId: string;
  hardwareId: string;
  doorStyle: CabinetDoorStyle;
  estimatedPriceUsd: number;
}

export interface FurnitureOption {
  id: string;
  category: "dining" | "stools" | "sofa" | "lighting";
  name: string;
  dimensions: string;
  materialNote: string;
  primaryHex: string;
  accentHex: string;
  isWood?: boolean;
  styleVariant: "a" | "b" | "c";
  priceUsd: number;
  proOnly: boolean;
}

export interface PlanRoom {
  id: string;
  name: string;
  zone: string;
  vastuNote: string;
  x: number;
  y: number;
  w: number;
  h: number;
  dimensionsFt: string;
  fill: string;
  isKitchen?: boolean;
}

export interface PlanColumn {
  id: string;
  x: number;
  y: number;
  size: string;
}

export interface ConstructionPlan {
  id: string;
  code: string;
  name: string;
  facing: "North" | "East" | "North-East" | "West";
  bedrooms: string;
  areaSqFt: number;
  plotSizeFt: string;
  vastuScore: number;
  structuralSystem: string;
  seismicZone: string;
  slabThicknessMm: number;
  foundationType: string;
  electricalLoadKw: number;
  estimatedBuildUsd: number;
  recommendedLayout: KitchenLayoutType;
  recommendedComboId: string;
  summary: string;
  engineeringHighlights: string[];
  rooms: PlanRoom[];
  columns: PlanColumn[];
  gridX: number[];
  gridY: number[];
}

export interface VastuBuyerProfile {
  plotFacing: string;
  kitchenZone: string;
  masterBedroomZone: string;
  rashi: string;
  nakshatra: string;
  propertyType: string;
  cityOrClimate: string;
}

export interface AdvisorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
