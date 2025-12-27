import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
    buildDiagramPrompt,
    getIntentPresets,
    type PresetType,
    type StyleType,
    type EmphasisType,
    type QualityMode,
} from "./prompts";

export const runtime = "nodejs"; // ensure Node runtime (for OpenAI SDK)

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type GenerateRequestBody = {
    prompt: string;
    preset?: PresetType | "";
    style?: StyleType;

    // new advanced fields (optional)
    quality?: QualityMode; // "draft" | "portfolio"
    emphasis?: EmphasisType; // "all" | "massing" | ...
    multiIntent?: boolean; // true => generate 4 diagrams
    count?: number; // optional override (1-4)
};

type DiagramResult = {
    intent: string;
    b64: string; // base64 png (no prefix)
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export async function POST(req: NextRequest) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY is missing in .env.local" },
                { status: 500 }
            );
        }

        const body = (await req.json()) as Partial<GenerateRequestBody>;

        const prompt = (body.prompt ?? "").trim();
        const preset = (body.preset ?? "") as PresetType | "";
        const style = (body.style ?? "minimal") as StyleType;

        // advanced (backward compatible defaults)
        const quality = (body.quality ?? "portfolio") as QualityMode;
        const emphasis = (body.emphasis ?? "all") as EmphasisType;
        const multiIntent = Boolean(body.multiIntent);

        // how many diagrams to return
        // - if multiIntent: default 4
        // - else: default 2 (same as your MVP)
        const requestedCount =
            typeof body.count === "number"
                ? clamp(Math.floor(body.count), 1, 4)
                : multiIntent
                    ? 4
                    : 2;

        if (!prompt && !preset) {
            return NextResponse.json(
                { error: "Prompt or preset is required." },
                { status: 400 }
            );
        }

        // Build intents list
        const intents = multiIntent
            ? getIntentPresets(preset).slice(0, requestedCount)
            : ["Primary diagram output"];

        // Helper: generate one image for a given intent
        async function generateOne(intent: string): Promise<DiagramResult> {
            const finalPrompt = buildDiagramPrompt({
                userPrompt: prompt,
                preset,
                style,
                emphasis,
                quality,
                intent,
            });

            const resp: any = await client.images.generate({
                model: "gpt-image-1",
                prompt: finalPrompt,
                n: 1,
                size: "1024x1024",
            });

            const b64 = resp?.data?.[0]?.b64_json;
            if (!b64) {
                throw new Error("Image API returned empty data.");
            }

            return { intent, b64 };
        }

        // Generate diagrams
        // NOTE: for stability/rate-limits, do sequential generation (safer).
        const results: DiagramResult[] = [];
        for (const intent of intents) {
            const item = await generateOne(intent);
            results.push(item);
        }

        // Backward compatible response:
        // - keep `images` array for your existing frontend
        // - also return `results` with intent metadata
        return NextResponse.json({
            images: results.map((r) => r.b64),
            results,
            meta: {
                preset: preset || "custom",
                style,
                quality,
                emphasis,
                multiIntent,
                count: results.length,
            },
        });
    } catch (err: any) {
        console.error("Error generating diagrams:", err);

        // Surface OpenAI error message if present
        const msg =
            err?.error?.message ||
            err?.message ||
            "Failed to generate diagrams.";

        const status = err?.status || 500;

        return NextResponse.json({ error: msg }, { status });
    }
}
