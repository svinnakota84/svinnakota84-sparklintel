export interface AdvisorContextPayload {
  planName?: string;
  planFacing?: string;
  planAreaSqFt?: number;
  vastuScore?: number;
  kitchenLayout?: string;
  cabinetPalette?: string;
  upperFinish?: string;
  lowerFinish?: string;
  countertop?: string;
  hardware?: string;
  castingSummary?: string;
  subscriptionTier?: string;
  buyerProfile?: {
    plotFacing?: string;
    kitchenZone?: string;
    masterBedroomZone?: string;
    rashi?: string;
    nakshatra?: string;
    propertyType?: string;
    cityOrClimate?: string;
  };
}

export function generateLocalAdvisorReply(
  question: string,
  context: AdvisorContextPayload
): string {
  const q = question.toLowerCase();
  const planName = context.planName ?? "Surya Courtyard Villa";
  const facing = context.buyerProfile?.plotFacing ?? context.planFacing ?? "North";
  const rashi = context.buyerProfile?.rashi ?? "Vrishabha (Taurus) — Earth";
  const nakshatra = context.buyerProfile?.nakshatra ?? "Rohini";
  const palette = context.cabinetPalette ?? "Alabaster & Warm Oak";
  const casting = context.castingSummary ?? "Monolithic & GFRC Structural Casting";

  if (q.includes("cast") || q.includes("wall") || q.includes("gfrc") || q.includes("waffle") || q.includes("commercial")) {
    return [
      `Spark&Lintel Design-Builders executes every type of architectural & structural casting (${casting}) for both commercial complexes and custom residences:`,
      `• Multi-Story Buildings & Courtyards: Monolithic Mivan RCC, Precast Insulated Wall Panels, and L-shape courtyard wings with column-free Post-Tensioned (PT) spans up to 52 ft.`,
      `• Boundary & Feature Walls: Segmented precast compound walls, fluted limestone-finish GFRC screens, and sculpted arched entry portals.`,
      `• Curved Shells & Waffle Halls: Vaulted GFRC thin-shell pavilions, cantilevered sky-bridges, and exposed two-way waffle-coffered atriums.`,
      `Note: All 3D builds are priced via custom 1-on-1 quote negotiation—use "Negotiate Casting Build" in the 3D Casting tab when ready.`,
    ].join("\n\n");
  }

  if (q.includes("vendor") || q.includes("george") || q.includes("sophia") || q.includes("damage") || q.includes("furniture") || q.includes("legal") || q.includes("reference") || q.includes("completed") || q.includes("finished") || q.includes("sue")) {
    return [
      `Spark&Lintel (Radiant Spark LLC) Global Legal Shield & Reference Disclosure:`,
      `• Reference-Only Finished & Completed Homes: Because Spark&Lintel is a newly launched company, all finished home images, modular retreats, commercial renderings, timelines, and sample scenarios on the site are illustrative visual references and design capability concepts ONLY—not past builds constructed by our firm.`,
      `• Direct Vendor Fulfillment: Furniture orders placed on third-party stores (George Buildings, Sophia Key Store, @sophiakey_designerfurniture) are contracts strictly between you and that seller. Pricing, warranty, customs, and delivery are handled solely by the selling vendor.`,
      `• Tri-Party Non-Liability Shield: File delivery damage or return claims directly with the selling vendor and carrier. Customers, vendors, and suppliers agree not to hold Radiant Spark LLC liable or file suit over reference visuals, third-party vendor orders, or independent local contractor site work.`,
    ].join("\n\n");
  }

  if (q.includes("price") || q.includes("cost") || q.includes("quote") || q.includes("negotiat") || q.includes("subscrib")) {
    return [
      `How Spark&Lintel Pricing & Subscriptions Work:`,
      `• Software Subscriptions ($29/mo Architect Pro or $79/mo Turnkey Studio) unlock all 12+ 3D cabinet palettes, custom wall color painting across Bedrooms/Toilets/Kitchens, all 4 structural construction plans, 3D furniture placement, and direct vendor storefronts.`,
      `• Construction & Custom Fabrication: We never show generic fixed villa sticker prices. Customize your structure, wall finishes, and 3D casting choices, then click "Negotiate Quote" for a 1-on-1 engineering & construction proposal tailored to your city (${context.buyerProfile?.cityOrClimate ?? "your location"}).`,
    ].join("\n\n");
  }

  return [
    `Vastu, Jyotish & Architectural Guidance for ${planName} (${facing} Facing):`,
    `• Vastu Alignment: Keeping the kitchen in the Agneya (South-East) sector with cooking facing East, Master Bedroom in Nairutya (South-West), and toilets positioned in West / North-West preserves positive Prana flow (${context.vastuScore ?? 95}% plan harmony).`,
    `• Rashi & Material Harmony (${rashi}, Nakshatra: ${nakshatra}): Your active "${palette}" cabinet finish (${context.upperFinish ?? "Alabaster"} / ${context.lowerFinish ?? "Oak"}, ${context.countertop ?? "Quartz"}, ${context.hardware ?? "Brass"}) balances Earth and Agni elements cleanly.`,
    `• Next Step: Test custom wall paint colors across every bedroom, toilet, and kitchen inside "Spark Construction", or request a 1-on-1 Negotiated Quote anytime.`,
  ].join("\n\n");
}
