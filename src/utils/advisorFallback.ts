export interface OfflineAdvisorContext {
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
  buyerProfile?: {
    plotFacing?: string;
    kitchenZone?: string;
    masterBedroomZone?: string;
    rashi?: string;
    nakshatra?: string;
    cityOrClimate?: string;
  };
}

export function generateLocalAdvisorReply(
  question: string,
  ctx: OfflineAdvisorContext
): string {
  const q = question.toLowerCase();
  const planName = ctx.planName ?? "Surya Courtyard Villa";
  const facing = ctx.buyerProfile?.plotFacing ?? ctx.planFacing ?? "North";
  const rashi = ctx.buyerProfile?.rashi ?? "Vrishabha (Taurus) — Earth";
  const kitchenZone = ctx.buyerProfile?.kitchenZone ?? "South-East (Agneya)";
  const palette = ctx.cabinetPalette ?? "Alabaster & Warm Oak";

  if (
    q.includes("cast") ||
    q.includes("commercial") ||
    q.includes("wall") ||
    q.includes("gfrc") ||
    q.includes("waffle")
  ) {
    return `Spark&Lintel Design-Builders Structural Casting Advisory:\n\n• Active Structure: ${
      ctx.castingSummary ?? "Custom Structural Casting"
    }\n• Capabilities: We execute Monolithic Cast-in-Situ RCC, Precast Boundary & Architectural Walls, GFRC Sculptural Arches/Shells, Waffle Coffered Slabs, Post-Tensioned Long-Span commercial plates, and L-Shaped Courtyard structures for both Residential and Commercial buildings.\n• Next Step: Use the 3D Casting tab to switch between Structure Forms (Walls, Pavilion, Courtyard, Waffle Hall, Multi-Story Tower), drag concrete/stone finishes directly onto the model, and click "Negotiate Casting Build" for a stamped local-engineering & site proposal.`;
  }

  if (
    q.includes("furniture") ||
    q.includes("cabinet") ||
    q.includes("color") ||
    q.includes("kitchen") ||
    q.includes("drag")
  ) {
    return `Spark&Lintel 3D Interiors & Furniture Advisory:\n\n• Active Kitchen Palette: "${palette}" (${
      ctx.upperFinish ?? "Upper"
    } / ${ctx.lowerFinish ?? "Lower"} with ${
      ctx.countertop ?? "Quartz"
    } countertop and ${ctx.hardware ?? "Brass"} hardware).\n• Furniture Placement: In Spark Interior Designs → Furniture, subscribed users can add sculptural bouclé sofas, travertine dining tables, fluted walnut credenzas, swivel chairs, and custom cabinetry—then drag and rotate each piece directly across the 3D floor.\n• Vastu Color Match: For ${facing}-facing homes and ${rashi}, warm alabaster, travertine, sage, and brushed brass keep Agneya (${kitchenZone}) balanced without dark clutter.`;
  }

  return `Spark&Lintel Architect & Vastu-Jyotish Summary (${planName}):\n\n• Plot & Entrance: ${facing} orientation works favorably when keeping the North-East (Ishanya) zone open for morning light and anchoring heavier structural walls/master suite in the South-West (Nairutya).\n• Kitchen & Rashi Harmony: With ${kitchenZone} and ${rashi}, your "${palette}" palette (${
    ctx.upperFinish ?? "Light finish"
  } + ${ctx.hardware ?? "Warm hardware"}) maintains strong elemental equilibrium.\n• Structural Check: Always verify M25/M30+ RCC column continuity, plinth beam damp-proofing, and local licensed PE/architect stamping before pouring concrete or finalizing purchase.\n\nHave a custom design ready? Click "Negotiate Quote" to review final construction or casting pricing 1-on-1.`;
}
