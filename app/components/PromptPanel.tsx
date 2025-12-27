"use client";

import React, { useMemo } from "react";

export type PromptStrengthLevel = "exploratory" | "focused" | "precise";

export type PromptStrengthResult = {
    score: number; // 0-100
    level: PromptStrengthLevel;
    label: string;
    reasons: string[];
    suggestions: string[];
};

type PromptExample = {
    title: string;
    text: string;
};

type TagChip = {
    label: string;
    value: string; // appended to prompt
};

type Props = {
    value: string;

    // ✅ rename to satisfy TS71007 (client props serializable rule)
    onChangeAction: (v: string) => void;

    language?: "en" | "zh";
    maxChars?: number; // default 500
    placeholder?: string;

    examples?: PromptExample[];
    tags?: TagChip[];

    // ✅ rename to satisfy TS71007
    onStrengthChangeAction?: (r: PromptStrengthResult) => void;

    // Optional: show/hide features
    showExamples?: boolean;
    showTags?: boolean;
    showStrength?: boolean;
};

const DEFAULT_EXAMPLES: PromptExample[] = [
    {
        title: "Exploration",
        text: "Massing study of a community library: simple stacked volumes, courtyard void, clear entrance axis.",
    },
    {
        title: "Focused",
        text: "Circulation diagram for a museum: main loop + secondary shortcuts, vertical circulation core, public vs staff separation, annotate key nodes.",
    },
    {
        title: "Precise",
        text: "Axonometric zoning diagram: 3 program bands (public / semi-public / service), show adjacency arrows, label hierarchy, high contrast, minimal text, clean line weights.",
    },
];

const DEFAULT_TAGS: TagChip[] = [
    { label: "Axonometric", value: " axonometric diagram" },
    { label: "Black/White", value: " black and white" },
    { label: "High Contrast", value: " high contrast" },
    { label: "Label Key Nodes", value: " label key nodes" },
    { label: "Add Arrows", value: " add directional arrows" },
    { label: "Public/Private", value: " public vs private zoning" },
    { label: "Hierarchy", value: " emphasize hierarchy" },
    { label: "Minimal Text", value: " minimal text" },
];

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

function countMatches(text: string, patterns: RegExp[]) {
    let c = 0;
    for (const p of patterns) {
        const m = text.match(p);
        if (m) c += m.length;
    }
    return c;
}

/**
 * Heuristic scoring:
 * - length / structure
 * - specificity keywords (diagram language)
 * - constraints / enumerations / numbers
 * - composition verbs (label, show, annotate)
 */
export function analyzePromptStrength(
    raw: string,
    language: "en" | "zh" = "en"
): PromptStrengthResult {
    const text = raw.trim();
    const len = text.length;

    if (!text) {
        return {
            score: 0,
            level: "exploratory",
            label: language === "zh" ? "未输入" : "Empty",
            reasons: [language === "zh" ? "还没有输入 prompt" : "No prompt yet"],
            suggestions: [
                language === "zh"
                    ? "先写：对象 + 图类型 + 你想表达的关系（例如：公共/私密、动线、层级）"
                    : "Start with: subject + diagram type + relationships (zoning / circulation / hierarchy).",
            ],
        };
    }

    // base score from length
    // sweet spot: 120~260 chars
    const lenScore =
        len < 40
            ? 10
            : len < 80
                ? 25
                : len < 120
                    ? 40
                    : len < 260
                        ? 60
                        : len < 380
                            ? 55
                            : 45;

    // structure signals
    const hasPunctuation = /[,:;，。；：]/.test(text);
    const hasLineBreaks = /\n/.test(text);
    const hasBullets = /(^|\n)\s*[-•*]\s+/.test(text);

    let structureScore = 0;
    if (hasPunctuation) structureScore += 10;
    if (hasLineBreaks) structureScore += 8;
    if (hasBullets) structureScore += 10;

    // specificity keywords (architectural diagram language)
    const kw = [
        // diagram types
        /massing|volume|zoning|program|circulation|section|axonometric|isometric|plan|diagram|hierarchy/i,
        // visual language
        /line\s*weight|contrast|monochrome|black\s*and\s*white|minimal|bold|RGB|grid|layer/i,
        // relationships
        /public|private|adjacen|sequence|node|threshold|entry|core|vertical|loop|arrow|label/i,
        // output directives
        /show|annotate|label|highlight|emphasize|clarify|reduce|simplify/i,
        // chinese equivalents
        /体量|分区|功能|动线|剖面|轴测|平面|层级|关系|公共|私密|入口|核心|节点|标注|箭头|线稿|黑白|对比|网格|图层/,
    ];

    const keywordHits = countMatches(text, kw);
    const keywordScore = clamp(keywordHits * 6, 0, 30);

    // constraints / numbers / enumerations
    const numberHits = (text.match(/\d+/g) || []).length;
    const enumHits = (text.match(/\b(public|private|service|staff|guest)\b/gi) || [])
        .length;
    const separatorHits = (text.match(/[\/|]/g) || []).length;

    const constraintsScore = clamp(
        numberHits * 4 + enumHits * 2 + separatorHits * 1,
        0,
        20
    );

    // clarity penalties (too vague)
    const vague = [
        /nice|cool|beautiful|awesome|good|make it better|random/i,
        /随便|好看|高级感|酷一点|优化一下|更好一点/,
    ];
    const vagueHits = countMatches(text, vague);
    const vaguePenalty = clamp(vagueHits * 8, 0, 20);

    // final
    let score = lenScore + structureScore + keywordScore + constraintsScore - vaguePenalty;
    score = clamp(Math.round(score), 0, 100);

    let level: PromptStrengthLevel = "exploratory";
    if (score >= 70) level = "precise";
    else if (score >= 40) level = "focused";

    const zh = language === "zh";
    const label =
        level === "precise"
            ? zh
                ? "精确 Precise"
                : "Precise"
            : level === "focused"
                ? zh
                    ? "聚焦 Focused"
                    : "Focused"
                : zh
                    ? "探索 Exploratory"
                    : "Exploratory";

    const reasons: string[] = [];
    if (len >= 80) reasons.push(zh ? "信息量足够" : "Enough detail");
    else reasons.push(zh ? "信息量偏少" : "Too little detail");

    if (keywordScore >= 18)
        reasons.push(zh ? "包含明确的图像语言/建筑术语" : "Clear diagram / architecture terms");
    else reasons.push(zh ? "术语较少，表达偏泛" : "Few diagram terms (a bit vague)");

    if (constraintsScore >= 10)
        reasons.push(zh ? "有约束/层级/分类（更可控）" : "Has constraints / categories (more controllable)");
    else reasons.push(zh ? "约束少，AI 更容易跑偏" : "Few constraints (model may drift)");

    if (vaguePenalty > 0) reasons.push(zh ? "存在模糊词（会降低可控性）" : "Contains vague words (reduces control)");

    const suggestions: string[] = [];
    if (score < 40) {
        suggestions.push(
            zh
                ? "补齐：图类型（massing/circulation/zoning）+ 你要表达的关系（比如 public vs private / loop）"
                : "Add: diagram type (massing/circulation/zoning) + relationships (public vs private / loop)."
        );
    }
    if (constraintsScore < 8) {
        suggestions.push(
            zh
                ? "加 1-2 个硬约束：比如 3 个分区、2 条主路径、标注关键节点、最少文字"
                : "Add 1–2 hard constraints: e.g., 3 zones, 2 main paths, label key nodes, minimal text."
        );
    }
    if (structureScore < 10) {
        suggestions.push(
            zh
                ? "用逗号或换行把信息分组（更稳定）：目标 / 关系 / 风格 / 标注"
                : "Group with commas/line breaks: goal / relationships / style / annotations."
        );
    }

    return { score, level, label, reasons, suggestions };
}

function StrengthBar({ score }: { score: number }) {
    const pct = clamp(score, 0, 100);
    return (
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
                className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export default function PromptPanel({
                                        value,
                                        onChangeAction,
                                        language = "en",
                                        maxChars = 500,
                                        placeholder = "Describe what you want to generate…",
                                        examples = DEFAULT_EXAMPLES,
                                        tags = DEFAULT_TAGS,
                                        onStrengthChangeAction,
                                        showExamples = true,
                                        showTags = true,
                                        showStrength = true,
                                    }: Props) {
    const strength = useMemo(() => analyzePromptStrength(value, language), [value, language]);

    React.useEffect(() => {
        onStrengthChangeAction?.(strength);
    }, [strength, onStrengthChangeAction]);

    const charCount = value.length;
    const charPct = clamp(Math.round((charCount / maxChars) * 100), 0, 100);

    const insertText = (t: string) => {
        const next = (value ? value.trimEnd() : "") + (value ? "\n" : "") + t;
        onChangeAction(next.slice(0, maxChars));
    };

    const appendTag = (t: string) => {
        const next = (value + t).slice(0, maxChars);
        onChangeAction(next);
    };

    const zh = language === "zh";

    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 bg-white/70 dark:bg-zinc-950/40">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="text-sm font-semibold">{zh ? "Prompt 工作区" : "Prompt Workspace"}</div>
                    <div className="text-xs text-zinc-500">
                        {zh ? "写清楚对象、关系、风格与标注，生成会更稳" : "Be explicit about subject, relationships, style & annotations."}
                    </div>
                </div>

                <div className="text-xs text-zinc-500 tabular-nums">
                    {charCount}/{maxChars}
                </div>
            </div>

            {/* Char progress */}
            <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                        className="h-1.5 rounded-full bg-zinc-500 dark:bg-zinc-300 transition-all"
                        style={{ width: `${charPct}%` }}
                    />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>{zh ? "长度进度" : "Length"}</span>
                    <span>{charPct}%</span>
                </div>
            </div>

            {/* Textarea */}
            <textarea
                value={value}
                onChange={(e) => onChangeAction(e.target.value.slice(0, maxChars))}
                placeholder={placeholder}
                className="w-full min-h-[140px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700"
            />

            {/* Tags */}
            {showTags && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                        <button
                            key={t.label}
                            type="button"
                            onClick={() => appendTag(t.value)}
                            className="px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                            title={t.value.trim()}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Strength (Improved UI) */}
            {showStrength && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <div className="text-sm font-semibold text-neutral-100">
                                {zh ? "Prompt 强度" : "Prompt Strength"}
                                <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[12.5px] font-medium text-neutral-200">
                  {strength.label}
                </span>
                            </div>
                            <div className="text-[13px] leading-relaxed text-neutral-300">
                                {strength.level === "exploratory"
                                    ? zh
                                        ? "当前偏探索，建议加约束让结果更稳定。"
                                        : "Currently exploratory — add constraints for more stable results."
                                    : strength.level === "focused"
                                        ? zh
                                            ? "已比较聚焦，可以生成；再加一两条约束会更可控。"
                                            : "Focused — good to generate. Add 1–2 constraints for more control."
                                        : zh
                                            ? "很精确，生成会更可控。"
                                            : "Precise — highly controllable."}
                            </div>
                        </div>

                        <div className="text-[13px] font-medium tabular-nums text-neutral-200">
                            {strength.score}/100
                        </div>
                    </div>

                    {/* Bar */}
                    <div className="space-y-1">
                        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-2.5 rounded-full bg-white/70 transition-all"
                                style={{ width: `${clamp(strength.score, 0, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[12.5px] text-neutral-400">
                            <span>{zh ? "更模糊" : "Vague"}</span>
                            <span>{zh ? "更精确" : "Precise"}</span>
                        </div>
                    </div>

                    {/* Top suggestion (compact) */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[13px] font-semibold text-neutral-100">
                            {zh ? "下一步建议" : "Next suggestion"}
                        </div>
                        <div className="mt-1 text-[13px] leading-relaxed text-neutral-200">
                            {strength.suggestions?.[0] ?? (zh ? "很好，已经比较可控了。" : "Looks solid and controllable.")}
                        </div>
                    </div>

                    {/* Details (collapsible) */}
                    <details className="group rounded-xl border border-white/10 bg-black/10">
                        <summary className="cursor-pointer select-none px-3 py-2 text-[13px] font-medium text-neutral-200 hover:bg-white/5 rounded-xl">
                            {zh ? "查看细节（Signals & 更多建议）" : "Details (Signals & more suggestions)"}
                            <span className="ml-2 text-neutral-500 group-open:hidden">+</span>
                            <span className="ml-2 text-neutral-500 hidden group-open:inline">−</span>
                        </summary>

                        <div className="px-3 pb-3 pt-1 space-y-3">
                            <div>
                                <div className="text-[13px] font-semibold text-neutral-100 mb-1">
                                    {zh ? "Signals" : "Signals"}
                                </div>
                                <ul className="text-[13px] leading-relaxed text-neutral-300 list-disc pl-5 space-y-1">
                                    {strength.reasons.slice(0, 4).map((r, i) => (
                                        <li key={i}>{r}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <div className="text-[13px] font-semibold text-neutral-100 mb-1">
                                    {zh ? "Suggestions" : "Suggestions"}
                                </div>
                                <ul className="text-[13px] leading-relaxed text-neutral-300 list-disc pl-5 space-y-1">
                                    {(strength.suggestions.length ? strength.suggestions : [])
                                        .slice(0, 4)
                                        .map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                </ul>
                            </div>
                        </div>
                    </details>
                </div>
            )}

            {/* Examples */}
            {showExamples && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                    <div className="text-xs font-semibold">{zh ? "示例（点一下插入）" : "Examples (click to insert)"}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {examples.map((ex) => (
                            <button
                                key={ex.title}
                                type="button"
                                onClick={() => insertText(ex.text)}
                                className="text-left rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                            >
                                <div className="text-sm font-semibold text-neutral-100">{ex.title}</div>
                                <div className="mt-1 text-[13px] leading-relaxed text-neutral-300 line-clamp-3">
                                    {ex.text}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
