/* ---------------------------------
   Types
--------------------------------- */

export type StyleType = "minimal" | "bold";

export type PresetType =
    | "massing"
    | "circulation"
    | "zoning"
    | "program"
    | "immersive"
    | "process";

export type EmphasisType =
    | "all"
    | "massing"
    | "circulation"
    | "program"
    | "experience";

export type QualityMode = "draft" | "portfolio";

/* ---------------------------------
   Public API
--------------------------------- */

/**
 * Build the final prompt sent to the image model.
 * This is a "product-grade" prompt: strong constraints + clear intent.
 */
export function buildDiagramPrompt(params: {
    userPrompt: string;
    preset?: PresetType | "";
    style?: StyleType;
    emphasis?: EmphasisType;
    quality?: QualityMode;
    intent?: string; // e.g. "Overall massing hierarchy", "Primary/secondary circulation"
}): string {
    const {
        userPrompt,
        preset,
        style = "minimal",
        emphasis = "all",
        quality = "portfolio",
        intent,
    } = params;

    const blocks = [
        systemRole(),
        qualityBlock(quality),
        renderingConstraints(style, quality),
        compositionConstraints(quality),
        diagramGrammar(),
        presetBlock(preset),
        emphasisBlock(emphasis),
        intentBlock(intent),
        userRequestBlock(userPrompt),
        outputReminder(),
    ];

    return blocks.filter(Boolean).join("\n\n").trim();
}

/**
 * Optional: intent presets for multi-intent generation
 */
export function getIntentPresets(preset?: PresetType | ""): string[] {
    // You can tune these per preset to be even more "on-rails"
    switch (preset) {
        case "massing":
            return [
                "Overall massing hierarchy and volumetric reading",
                "Site coverage and setback logic (abstract)",
                "Solid-void relationships and courtyard strategy",
                "Step-backs and height gradient (conceptual)",
            ];
        case "circulation":
            return [
                "Primary circulation loop and key nodes",
                "Secondary circulation branches and shortcuts",
                "Entry sequence to central orientation space",
                "Back-of-house vs public circulation separation",
            ];
        case "zoning":
            return [
                "Public vs private zoning separation",
                "Adjacency and program clustering strategy",
                "Front-of-house vs back-of-house zoning",
                "Gradient of accessibility (public → private)",
            ];
        case "program":
            return [
                "Program hierarchy (primary vs secondary spaces)",
                "Adjacency map translated into block diagram",
                "Public anchor spaces and supporting spaces",
                "Vertical stacking logic and transitions",
            ];
        case "immersive":
            return [
                "Experience sequence: entry → buildup → climax → release",
                "Moments of compression and expansion",
                "Key experiential nodes and thresholds",
                "Wayfinding narrative and pacing",
            ];
        case "process":
            return [
                "Step-by-step mass transformation (3–5 frames)",
                "Subtraction and carving operations (conceptual)",
                "Rotation/shift to form view corridors (abstract)",
                "Iteration sequence with clear arrows between states",
            ];
        default:
            return [
                "Overall spatial logic and hierarchy",
                "Circulation and movement intent",
                "Program adjacency and zoning logic",
                "Experiential sequence and transitions",
            ];
    }
}

/* ---------------------------------
   Prompt Blocks
--------------------------------- */

function systemRole(): string {
    return `
You are an architectural diagram generator for spatial design thinking.
Your output must look like a clean studio / portfolio diagram, not an illustration.
`.trim();
}

function qualityBlock(quality: QualityMode): string {
    if (quality === "draft") {
        return `
Mode: DRAFT
Goal: fast ideation and variation. Keep it simple and readable.
`.trim();
    }
    return `
Mode: PORTFOLIO
Goal: portfolio-ready clarity, disciplined composition, consistent graphics.
`.trim();
}

function renderingConstraints(style: StyleType, quality: QualityMode): string {
    const common = `
Rendering constraints (MANDATORY):
- Architectural diagram, NOT a sketch, NOT an illustration, NOT a rendering
- White background only
- Flat graphic output (no textures, no material realism)
- No shadows, no gradients, no 3D shading
- No people, no furniture, no trees, no realistic context
- Use rectilinear / geometric block volumes
- Use a clean axonometric OR orthographic projection (avoid strong perspective distortion)
- Maintain generous negative space
- Keep edges crisp and readable
`.trim();

    const lineworkMinimal = `
Linework style:
- Thin, consistent black lineweight
- Clean outlines with uniform stroke
- If fills exist, keep them very light (or none)
- Arrows are simple, consistent, and minimal
`.trim();

    const boldColors = `
Color style:
- Use only primary colors: red, blue, yellow (plus black outlines)
- Flat fills, no gradients
- High contrast but disciplined composition
- Limit palette (do not introduce extra colors)
- Keep arrows and outlines consistent
`.trim();

    const portfolioExtras =
        quality === "portfolio"
            ? `
Portfolio polish:
- Balanced margins and centered composition
- Avoid clutter and decorative elements
- Ensure a strong figure-ground relationship
- Maintain consistent spacing between blocks
`.trim()
            : "";

    return [common, style === "minimal" ? lineworkMinimal : boldColors, portfolioExtras]
        .filter(Boolean)
        .join("\n\n");
}

function compositionConstraints(quality: QualityMode): string {
    if (quality === "draft") {
        return `
Composition:
- Keep layout simple and readable
- Avoid too many elements
- Prioritize clarity over completeness
`.trim();
    }
    return `
Composition:
- Centered layout with clear hierarchy
- 1 main reading focus + supporting elements
- Strong alignment and consistent spacing
- Do not overcrowd the canvas
`.trim();
}

function diagramGrammar(): string {
    return `
Diagram grammar:
- Use block volumes to represent spaces/programs
- Use arrows to represent movement only when relevant
- Use dashed lines sparingly to indicate secondary / optional relationships
- Use minimal annotation (prefer none). If any marks appear, keep them abstract (no text)
- Prioritize: hierarchy, adjacency, sequence, and legibility
`.trim();
}

function presetBlock(preset?: PresetType | ""): string {
    switch (preset) {
        case "massing":
            return `
Diagram type: MASSING & VOLUME
- 2–4 primary volumes (simple blocks)
- Show hierarchy via size/height (conceptual)
- Emphasize solid-void relationships
`.trim();

        case "circulation":
            return `
Diagram type: CIRCULATION FLOW
- Circulation is the primary subject
- Use arrows to show direction
- Distinguish primary vs secondary paths clearly
- Keep volumes minimal and secondary
`.trim();

        case "zoning":
            return `
Diagram type: PROGRAM ZONING
- Use distinct blocks to represent zones
- Show adjacency and separation
- Emphasize public/semi-public/private gradient
`.trim();

        case "program":
            return `
Diagram type: PROGRAM HIERARCHY
- Show primary vs secondary spaces with size and grouping
- Emphasize hierarchy and clustering
- Avoid detailed partitions; stay abstract
`.trim();

        case "immersive":
            return `
Diagram type: SPATIAL EXPERIENCE
- Show a clear sequence of spaces (journey)
- Highlight nodes, thresholds, transitions
- Compression/release can be expressed via volume size and spacing
`.trim();

        case "process":
            return `
Diagram type: DESIGN PROCESS
- Show 3–5 steps or states
- Use arrows to indicate transformation
- Each step must be clearly separated and readable
`.trim();

        default:
            return `
Diagram type: GENERIC ARCHITECTURAL CONCEPT
- Focus on spatial relationships and clarity
- Keep abstraction high
`.trim();
    }
}

function emphasisBlock(emphasis: EmphasisType): string {
    switch (emphasis) {
        case "massing":
            return `
Emphasis override:
- MASSING ONLY
- No arrows
- No internal subdivision
- Show solid volumes and their relationship only
`.trim();

        case "circulation":
            return `
Emphasis override:
- CIRCULATION ONLY
- Show arrows/paths as the main content
- Volumes should be minimal outlines or very light blocks
`.trim();

        case "program":
            return `
Emphasis override:
- PROGRAM ONLY
- Show program blocks and adjacency clearly
- Minimize arrows; avoid circulation detail
`.trim();

        case "experience":
            return `
Emphasis override:
- EXPERIENCE SEQUENCE
- Focus on transitions and nodes
- Use arrows sparingly to guide reading order
`.trim();

        default:
            return `
Emphasis:
- Balanced: volumes + relationships (and arrows only if relevant)
`.trim();
    }
}

function intentBlock(intent?: string): string {
    if (!intent) return "";
    return `
Specific intent focus:
- ${intent}
`.trim();
}

function userRequestBlock(userPrompt: string): string {
    return `
Design description from user:
${userPrompt?.trim() ? userPrompt.trim() : "(no additional input)"}
`.trim();
}

function outputReminder(): string {
    return `
Output requirements:
- Single diagram image
- Clean white background
- Diagrammatic clarity above all
`.trim();
}

/* ---------------------------------
   Optional: Text Explanation Prompt
--------------------------------- */

/**
 * Use this prompt for generating an explanation/caption (for later "Explain" feature).
 */
export function buildExplanationPrompt(params: {
    userPrompt: string;
    preset?: PresetType | "";
    style?: StyleType;
    emphasis?: EmphasisType;
    quality?: QualityMode;
    intent?: string;
    language?: "en" | "zh";
}): string {
    const {
        userPrompt,
        preset,
        style = "minimal",
        emphasis = "all",
        quality = "portfolio",
        intent,
        language = "en",
    } = params;

    const langRule =
        language === "zh"
            ? "Write in concise, natural Chinese."
            : "Write in concise, natural English.";

    return `
You are an architecture studio assistant. ${langRule}

Write a short caption (4–6 sentences) that explains the diagram's design logic.
Do NOT mention AI. Do NOT mention prompts. Do NOT mention tools.

Context:
- Diagram type: ${preset || "generic"}
- Style: ${style}
- Mode: ${quality}
- Emphasis: ${emphasis}
- Intent: ${intent || "general spatial logic"}
- User description: ${userPrompt || "(none)"}

Caption should:
- Describe the spatial hierarchy and key relationships
- Mention circulation / zoning / sequence only if relevant
- Sound portfolio-ready and professional
`.trim();
}
