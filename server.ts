import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

interface AdvisorMessageInput {
  role: "user" | "assistant";
  content: string;
}

interface AdvisorContextInput {
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

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "spark-lintel-design-builders" });
  });

  app.post("/api/advisor", async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
        });
        return;
      }

      const body = req.body as {
        messages?: AdvisorMessageInput[];
        context?: AdvisorContextInput;
      };

      const messages = Array.isArray(body?.messages) ? body.messages : [];
      if (messages.length === 0) {
        res.status(400).json({ error: "Please provide at least one question." });
        return;
      }

      const ctx = body.context ?? {};
      const buyer = ctx.buyerProfile ?? {};

      const systemInstruction = `You are Spark&Lintel Design-Builders Principal Architect, Structural Civil Engineer & Indian Vastu-Jyotish (Vedic Astrology) Advisor.
You help homebuyers, commercial developers, and homeowners evaluate:
1. Structural Casting & Civil Engineering (Commercial & Residential): Monolithic RCC cast-in-situ, precast architectural wall panels, GFRC sculptural arches & curved facades, post-tensioned (PT) long-span slabs, waffle/coffered ceilings, cantilevered shells, precast beam-column towers, tilt-up hybrid halls, seismic safety, and slim-frame Low-E glazing envelopes.
2. Kitchen Cabinetry, Countertop Materials & Sculptural Designer Furniture Selection: work-triangle ergonomics, BWP marine ply vs HDHMR, PU lacquer vs fluted timber vs acrylic, quartz/travertine stone, brass/SS hardware, bouclé & timber lounge suites.
3. Indian Vastu Shastra & Vedic Astrology (Jyotish) for buying or building a house or commercial space:
   - Directional evaluation: North (Kubera/wealth), North-East/Ishanya (water, pooja, morning light), East (Indra/Surya, entrance), South-East/Agneya (fire/kitchen), South-West/Nairutya (master suite/director cabin/stability), North-West/Vayavya (guest/air/alternate kitchen).
   - Jyotish house-buying guidance: Rashi & Nakshatra elemental harmony (Agni, Prithvi, Vayu, Jala signs), Tara Bala / Griha Pravesh planning, main door Pada considerations, and practical architectural remedies when an existing building cannot be structurally rebuilt.

ACTIVE CUSTOMER STUDIO CONTEXT:
- Selected Construction Plan: ${ctx.planName ?? "Surya Courtyard Villa"} (${ctx.planFacing ?? "North"}-facing, ${ctx.planAreaSqFt ?? 2450} sq ft, Vastu Score ${ctx.vastuScore ?? 96}%)
- Active 3D Kitchen Configuration: Layout ${ctx.kitchenLayout ?? "L-Shape + Island"}, Palette "${ctx.cabinetPalette ?? "Alabaster & Warm Oak"}", Upper: ${ctx.upperFinish ?? "Alabaster"}, Lower: ${ctx.lowerFinish ?? "Warm Oak"}, Countertop: ${ctx.countertop ?? "Calacatta Quartz"}, Hardware: ${ctx.hardware ?? "Brushed Brass"}
- Active 3D Building Casting Configuration: ${ctx.castingSummary ?? "Residential GFRC Sculptural Arches"}
- Subscription Plan: ${ctx.subscriptionTier ?? "Starter"}

HOMEBUYER VASTU & JYOTISH PROFILE:
- Plot / Door Facing: ${buyer.plotFacing ?? "North"}
- Kitchen Zone: ${buyer.kitchenZone ?? "South-East (Agneya)"}
- Master Bedroom Zone: ${buyer.masterBedroomZone ?? "South-West (Nairutya)"}
- Buyer Rashi (Moon Sign): ${buyer.rashi ?? "Vrishabha (Taurus)"}
- Nakshatra / Birth Note: ${buyer.nakshatra ?? "Not specified"}
- Property Stage: ${buyer.propertyType ?? "New House / Under Construction"}
- Location / Climate: ${buyer.cityOrClimate ?? "Not specified"}

GUIDELINES:
- Give clear, structured, actionable architectural + Vastu-Jyotish advice grounded in real engineering and traditional Vastu/Vedic principles.
- Reference the customer's exact active 3D finishes, plan details, or Rashi/facing profile when relevant.
- Keep responses concise, scannable (short sections with clear plain-text headings and bullet points), and practical — avoid vague fluff or fatalistic fear-mongering; always pair any Vastu concern with constructive structural or interior remedies.
- Never claim to replace a licensed local structural engineer stamp or personal astrologer's full Janma Kundali muhurta reading; note this briefly when giving critical buying advice.
- Legal Shield & New-Company Transparency: If asked about finished/completed homes, vendor stores (George Buildings, Sophia Key Store), warranties, or disputes, clearly state that finished home visuals are illustrative architectural references only (as Spark&Lintel / Radiant Spark LLC is a new company) and that third-party vendor orders and site contractor execution remain legally separate from our visualization platform.`;

      const formattedConversation = messages
        .slice(-10)
        .map(
          (m) =>
            `${m.role === "user" ? "Customer" : "Advisor"}: ${m.content.trim()}`
        )
        .join("\n\n");

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: formattedConversation,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({
          error: "Advisor returned an empty response. Please try again.",
        });
        return;
      }

      res.json({ reply });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to reach AI advisor.";
      console.error("Advisor API error:", message);
      res.status(500).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Spark&Lintel Design-Builders server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
