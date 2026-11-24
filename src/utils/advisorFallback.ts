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
  const q = question.trim().toLowerCase();

  if (/\b(?:refunds?|returns?|warrant(?:y|ies)|damag(?:e|ed)|shipping|delivery|customs)\b/.test(q)) {
    return "Check the seller’s product listing or contact the seller to confirm delivery, customs, returns and warranty terms. For an existing order, contact the seller directly with your order number and photos of any damage.";
  }

  if (/\b(?:arcedo|reekon|boldr|archdaily|inspiration|inspirations|architecture references)\b/.test(q)) {
    if (/\b(?:reekon|boldr)\b/.test(q)) {
      return "Use your REEKON measurements to record room and doorway clearances. Enter the product’s width, depth and height in 3D Studio → Vendor Furniture → Add product to room. This workflow uses manual entry.";
    }
    if (/\barcedo\b/.test(q)) {
      return "Arcedo Innovations is an external design-build reference. Apply a similar sequence in SparkLintel: choose a floor plan in Spark Construction, review the exterior, then compare finishes and furniture in the 3D Studio.";
    }
    return "Open Design Inspiration in the 3D Studio for ArchDaily’s residential projects. Look for a project with a similar plot, climate or room size, then compare how it uses daylight, circulation and materials.";
  }

  if (/\b(?:furniture|sofas?|chairs?|couches|tables?|george|sophia|sophiakey|instagram|vendors?)\b/.test(q)) {
    if (/\b(?:fit|size|measure|dimensions?|clearance|width|depth|height)\b/.test(q)) {
      return "Compare the vendor’s width, depth and height with your available floor space, door openings and walking routes. Enter those dimensions under 3D Studio → Vendor Furniture → Add product to room. Share the room and product measurements if you want to continue with a specific fit question.";
    }
    if (/\b(?:price|cost|buy|order|checkout)\b/.test(q)) {
      return "Open the original listing under 3D Studio → Vendor Furniture to check current prices and place or request an order directly with the seller.";
    }
    return "In 3D Studio → Vendor Furniture, subscribers can choose George Buildings, Sophia Key Store or Sophia Key Instagram. Select Add product to room, enter the listing link and dimensions, then tap the 3D floor. The preview keeps a link to the original listing.";
  }

  if (/\b(?:stair(?:s|case)?|courtyard|duplex|bedroom|bathroom|toilet|floor plan|layout)\b/.test(q) && !/\b(?:vastu|jyotish|rashi|nakshatra)\b/.test(q)) {
    const plan = context.planName ? ` Your current selection is ${context.planName}.` : "";
    if (/\b(?:stair(?:s|case)?|courtyard|duplex)\b/.test(q)) {
      return `Review both levels in Spark Construction.${plan} Trace the stair from the ground floor to the upstairs landing and mark the courtyard edge on both levels. Share the plot or room dimensions and the opening you want to change so the question can be narrowed down.`;
    }
    return `Open Spark Construction to compare room arrangements and finishes.${plan} Share which room or floor you want to change and its dimensions.`;
  }

  if (/\b(?:gfrc|waffle|casting|cast|precast|concrete|structural|rcc)\b/.test(q)) {
    if (/\bgfrc\b/.test(q) && /\bwaffle\b/.test(q)) {
      return "GFRC commonly forms thin architectural cladding and sculpted shapes. A waffle slab is a ribbed structural floor or roof system. Compare the forms in 3D Casting and have the structural system designed by a local structural engineer.";
    }
    return "Use 3D Casting to compare concrete forms and finishes. For a structural decision, identify the intended use, span and loads and have a local structural engineer review them.";
  }

  if (/\b(?:vastu|jyotish|astrology|rashi|nakshatra)\b/.test(q)) {
    const facing = context.buyerProfile?.plotFacing ?? context.planFacing;
    return `Vastu traditionally places kitchens toward the southeast and main bedrooms toward the southwest. ${facing ? `The current facing selection is ${facing}. ` : ""}For a specific layout question, identify the room and its direction on the plan. Use the Vastu Advisor for the optional Rashi and Nakshatra profile.`;
  }

  if (/\b(?:cabinet(?:s|ry)?|countertop|paint|finishes|palette|color|colour|kitchen)\b/.test(q)) {
    return `In 3D Studio, compare cabinet and countertop finishes under the same view. ${context.cabinetPalette ? `Your current palette is ${context.cabinetPalette}. ` : ""}Tell me which finish, color or kitchen feature you want to compare.`;
  }

  if (/\b(?:subscri\w*|membership|pricing|checkout|quote|cost)\b/.test(q)) {
    return "Open Pricing to see the current studio subscription tiers and available checkout options. To request a project-specific proposal, select Negotiate Quote from your design workspace.";
  }

  if (/\b(?:completed builds|past projects|portfolio|finished homes)\b/.test(q)) {
    return "The finished-home visuals in the SparkLintel portfolio are illustrative design references. Ask about the layout, material or exterior detail you want to use for your own concept.";
  }

  if (/^(?:hi|hello|hey)[!. ]*$/.test(q)) {
    return "Hi! What are you working on? I can help with house plans, kitchen finishes, vendor furniture, casting, design references and studio subscriptions.";
  }

  return "I don’t have a specific answer for that in Studio Help. If it’s about your design, share the room, feature or vendor product you’re working with.";
}
