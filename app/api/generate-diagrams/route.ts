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

export const runtime = "nodejs";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type GenerateRequestBody = {
    prompt: string;
    preset?: PresetType | "";
    style?: StyleType;

    quality?: QualityMode;     // "draft" | "portfolio"
    emphasis?: EmphasisType;   // "all" | "massing" | ...
    multiIntent?: boolean;     // true => multiple intents
    count?: number;            // 1-4
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

        const quality = (body.quality ?? "portfolio") as QualityMode;
        const emphasis = (body.emphasis ?? "all") as EmphasisType;
        const multiIntent = Boolean(body.multiIntent);

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

        // Decide intents:
        // - multiIntent: generate multiple different intents (each 1 image)
        // - single intent: one intent, but multiple variations (n = requestedCount)
        const intents = multiIntent
            ? getIntentPresets(preset).slice(0, requestedCount)
            : ["Primary diagram output"];

        // Generate for one intent
        async function generateForIntent(intent: string): Promise<DiagramResult[]> {
            const finalPrompt = buildDiagramPrompt({
                userPrompt: prompt,
                preset,
                style,
                emphasis,
                quality,
                intent,
            });

            const n = multiIntent ? 1 : requestedCount;

            const resp: any = await client.images.generate({
                model: "gpt-image-1",
                prompt: finalPrompt,
                n,
                size: "1024x1024",
            });

            const data = Array.isArray(resp?.data) ? resp.data : [];
            const b64s = data.map((d: any) => d?.b64_json).filter(Boolean);

            if (b64s.length === 0) {
                throw new Error("Image API returned empty data.");
            }

            return b64s.map((b64: string) => ({ intent, b64 }));
        }

        // Generate results (sequential for stability)
        const results: DiagramResult[] = [];
        for (const intent of intents) {
            const items = await generateForIntent(intent);
            results.push(...items);
        }

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
                requestedCount,
            },
        });
    } catch (err: any) {
        console.error("Error generating diagrams:", err);

        const msg = err?.error?.message || err?.message || "Failed to generate diagrams.";
        const status = err?.status || 500;

        return NextResponse.json({ error: msg }, { status });
    }
}
