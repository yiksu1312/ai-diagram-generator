"use client";

import { useMemo, useState } from "react";
import PromptPanel, { PromptStrengthResult } from "@/app/components/PromptPanel";

type Language = "en" | "zh";
type StyleType = "minimal" | "bold";
type PresetType =
    | "massing"
    | "circulation"
    | "zoning"
    | "program"
    | "immersive"
    | "process"
    | "custom";

const DICT = {
  en: {
    title: "AI Diagram Generator",
    subtitle: "for Architectural Thinking",
    language: "Language",
    designQuestion: "What design question are you exploring?",
    preset: {
      massing: "Massing & Volume",
      circulation: "Circulation Flow",
      zoning: "Program Zoning",
      program: "Program Hierarchy",
      immersive: "Spatial Experience",
      process: "Design Process",
      custom: "Custom Prompt",
    },
    style: {
      label: "Style",
      minimal: "Minimal (B/W)",
      bold: "Bold (RGB)",
    },
    promptLabel: "Prompt",
    promptPlaceholder:
        'Describe the design logic you want to explore...\nE.g. "Zoning massing with 3 volumes around a courtyard"',
    tip: 'Tip: Use keywords like "block volumes", "arrows", "clean white background".',
    generate: "Generate",
    generating: "Generating…",
    results: "Results",
    empty: "No diagrams generated yet. Choose a preset and click Generate.",
    loadingPanel: "Generating diagrams…",
    download: "Download",
    promptRequired: "Please enter a prompt to generate diagrams.",
    promptTooWeak:
        "Prompt is a bit too vague — try adding diagram type + constraints (e.g., 3 zones, arrows, label nodes).",

    intentTitle: "Design Intent",
    intentSubtitle: "A quick snapshot of what you’re generating right now.",
    intentDiagramType: "Diagram Type",
    intentFocus: "Focus",
    intentVisual: "Visual Language",
    intentGoal: "Output Goal",
    intentStatus: "Status",
    statusNoPrompt: "No prompt yet",
    statusPromptAdded: "Prompt added",
    goalEarly: "Early exploration (add constraints)",
    goalGuided: "Guided exploration (stable outputs)",
    goalHigh: "High control (presentation-ready)",
  },
  zh: {
    title: "AI Diagram Generator",
    subtitle: "建筑设计思维辅助工具",
    language: "语言",
    designQuestion: "你正在探索什么设计问题？",
    preset: {
      massing: "体量与空间",
      circulation: "流线关系",
      zoning: "功能分区",
      program: "功能层级",
      immersive: "空间体验",
      process: "设计过程",
      custom: "自定义输入",
    },
    style: {
      label: "风格",
      minimal: "极简黑白",
      bold: "概念彩色",
    },
    promptLabel: "输入描述",
    promptPlaceholder: '描述你想探索的设计逻辑...\n例如：“围绕中庭的三体量功能分区”',
    tip: '提示：可加入 “block volumes”“arrows”“clean white background”等关键词。',
    generate: "生成",
    generating: "生成中…",
    results: "结果",
    empty: "还没有生成图像。请选择预设并点击生成。",
    loadingPanel: "正在生成图像…",
    download: "下载",
    promptRequired: "请输入内容后再生成。",
    promptTooWeak:
        "描述有点泛 — 建议补充“图类型 + 约束”（例如：3 个分区、箭头、标注节点）。",

    intentTitle: "设计意图",
    intentSubtitle: "当前生成目标的快速摘要。",
    intentDiagramType: "图解类型",
    intentFocus: "关注点",
    intentVisual: "视觉语言",
    intentGoal: "输出目标",
    intentStatus: "状态",
    statusNoPrompt: "还未输入",
    statusPromptAdded: "已输入",
    goalEarly: "早期探索（建议加约束）",
    goalGuided: "引导探索（输出更稳）",
    goalHigh: "高可控（适合呈现）",
  },
} as const;

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function Spinner() {
  return (
      <span
          className={cx(
              "inline-block h-4 w-4 rounded-full border border-white/40 border-t-white",
              "animate-spin"
          )}
          aria-hidden="true"
      />
  );
}

export default function Page() {
  const [lang, setLang] = useState<Language>("en");
  const t = DICT[lang];

  const [preset, setPreset] = useState<PresetType>("massing");
  const [style, setStyle] = useState<StyleType>("minimal");

  const [prompt, setPrompt] = useState("");
  const [strength, setStrength] = useState<PromptStrengthResult | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetHint = useMemo(() => {
    const map: Record<PresetType, string> = {
      massing: lang === "en" ? "Hierarchy, block volumes" : "层级、块状体量",
      circulation: lang === "en" ? "Arrows, main/secondary paths" : "箭头、主次流线",
      zoning: lang === "en" ? "Adjacency, separation" : "相邻关系、分隔",
      program: lang === "en" ? "Primary/secondary spaces" : "主次空间",
      immersive: lang === "en" ? "Sequence, nodes, transitions" : "序列、节点、转场",
      process: lang === "en" ? "Steps, evolution" : "步骤、演变",
      custom: lang === "en" ? "Free-form input" : "自由输入",
    };
    return map[preset];
  }, [preset, lang]);

  const designIntent = useMemo(() => {
    const score = strength?.score ?? 0;
    const goal =
        score >= 70 ? t.goalHigh : score >= 35 ? t.goalGuided : t.goalEarly;

    const visualTokens =
        style === "minimal"
            ? lang === "en"
                ? ["Black/White", "Clean background", "Diagram labels"]
                : ["黑白", "干净背景", "标注"]
            : lang === "en"
                ? ["RGB layers", "High contrast", "Legend / labels"]
                : ["RGB 分层", "高对比", "图例 / 标注"];

    const promptState =
        prompt.trim().length === 0 ? t.statusNoPrompt : t.statusPromptAdded;

    return {
      score,
      diagramType: t.preset[preset],
      focus: presetHint,
      styleText: style === "minimal" ? t.style.minimal : t.style.bold,
      goal,
      visualTokens,
      promptState,
    };
  }, [strength, style, lang, t, preset, presetHint, prompt]);

  // gating
  const isPromptEmpty = prompt.trim().length === 0;
  const strengthScore = strength?.score ?? 0;
  const STRENGTH_MIN = 25;
  const isStrengthTooLow = !isPromptEmpty && strengthScore < STRENGTH_MIN;
  const isGenerateDisabled = loading || isPromptEmpty || isStrengthTooLow;

  async function handleGenerate() {
    if (isGenerateDisabled) {
      if (!loading && isPromptEmpty) setError(t.promptRequired);
      if (!loading && !isPromptEmpty && isStrengthTooLow) setError(t.promptTooWeak);
      return;
    }

    setLoading(true);
    setError(null);
    setImages([]);

    try {
      const res = await fetch("/api/generate-diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: preset === "custom" ? "" : preset,
          style,
          prompt,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data?.error || "Failed to generate diagrams.");
        return;
      }

      setImages(data.images || []);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
      <>
        {/* ✅ Move background OUTSIDE <main> so it won't be affected by any transforms/reflow inside */}
        <div
            className="pointer-events-none fixed inset-0 -z-20 bg-[#0F1115]"
            style={{
              backgroundImage: "url(/bg-arch-wireframe.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
        />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-black/15" />
        <div className="pointer-events-none fixed inset-0 -z-10 [background:radial-gradient(60%_55%_at_50%_20%,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.75)_55%,rgba(0,0,0,0.92)_100%)]" />

        <main className="relative min-h-screen text-neutral-100">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div>
                <h1 className="text-base font-semibold tracking-tight">{t.title}</h1>
                <p className="text-xs text-neutral-400">{t.subtitle}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <span className="text-neutral-400">{t.language}</span>
                <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={cx(
                        "rounded-md px-2 py-1 transition",
                        "hover:bg-white/10 active:scale-[0.98]",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                        lang === "en" && "bg-white/10"
                    )}
                >
                  EN
                </button>
                <button
                    type="button"
                    onClick={() => setLang("zh")}
                    className={cx(
                        "rounded-md px-2 py-1 transition",
                        "hover:bg-white/10 active:scale-[0.98]",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                        lang === "zh" && "bg-white/10"
                    )}
                >
                  中文
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
            {/* TOP: Controls */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Left: Preset + Design Intent */}
              <div className="rounded-2xl border border-white/10 bg-[#16181D]/85 p-5 backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-neutral-200">{t.designQuestion}</div>

                  <div className="relative">
                    <button
                        type="button"
                        className={cx(
                            "group inline-flex h-6 w-6 items-center justify-center rounded-full",
                            "border border-white/10 bg-black/20 text-xs text-neutral-200",
                            "hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                        )}
                        aria-label="Preset help"
                    >
                      ?
                      <span
                          className={cx(
                              "pointer-events-none absolute right-0 top-full z-50 mt-2 w-72",
                              "rounded-xl border border-white/10 bg-[#0F1115]/95 px-3 py-2",
                              "text-[13px] leading-relaxed text-neutral-100 shadow-xl",
                              "opacity-0 translate-y-1 transition",
                              "group-hover:opacity-100 group-hover:translate-y-0",
                              "group-focus:opacity-100 group-focus:translate-y-0"
                          )}
                          role="tooltip"
                      >
                      {lang === "en"
                          ? "Pick a diagram lens. Only the selected preset shows a hint to keep it clean."
                          : "选择图解视角。为了不拥挤，只对当前选中的预设显示提示。"}
                    </span>
                    </button>
                  </div>
                </div>

                {/* ✅ remove scroll (no wheel) */}
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(t.preset) as PresetType[]).map((key) => (
                      <button
                          key={key}
                          type="button"
                          onClick={() => setPreset(key)}
                          className={cx(
                              "rounded-xl border px-4 py-3 text-left transition",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
                              "active:scale-[0.99]",
                              preset === key
                                  ? "border-white/25 bg-white/10"
                                  : "border-white/10 bg-black/20 hover:bg-white/5"
                          )}
                      >
                        <div className="text-sm font-medium text-neutral-100">{t.preset[key]}</div>
                        {key === preset && (
                            <div className="mt-1 text-[13px] leading-relaxed text-neutral-300">
                              {presetHint}
                            </div>
                        )}
                      </button>
                  ))}
                </div>

                {/* ---- Design Intent Panel ---- */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-100">{t.intentTitle}</div>
                      <div className="mt-1 text-[13px] leading-relaxed text-neutral-300">
                        {t.intentSubtitle}
                      </div>
                    </div>
                    <div className="text-[13px] font-medium tabular-nums text-neutral-200">
                      {designIntent.score}/100
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[12.5px] font-semibold text-neutral-200">
                        {t.intentDiagramType}
                      </div>
                      <div className="mt-1 text-[14px] font-semibold text-neutral-100">
                        {designIntent.diagramType}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[12.5px] font-semibold text-neutral-200">
                        {t.intentFocus}
                      </div>
                      <div className="mt-1 text-[13px] leading-relaxed text-neutral-100">
                        {designIntent.focus}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[12.5px] font-semibold text-neutral-200">
                        {t.intentVisual}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[12.5px] text-neutral-200">
                        {designIntent.styleText}
                      </span>

                        {designIntent.visualTokens.map((tok) => (
                            <span
                                key={tok}
                                className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[12.5px] text-neutral-200"
                            >
                          {tok}
                        </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[12.5px] font-semibold text-neutral-200">
                        {t.intentGoal}
                      </div>
                      <div className="mt-1 text-[13px] leading-relaxed text-neutral-100">
                        {designIntent.goal}
                      </div>

                      <div className="mt-2 text-[13px] text-neutral-300">
                        {t.intentStatus}:{" "}
                        <span className="text-neutral-100">{designIntent.promptState}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Style + Prompt + Generate */}
              <div className="rounded-2xl border border-white/10 bg-[#16181D]/85 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-neutral-200">{t.style.label}</div>

                  <div className="relative">
                    <button
                        type="button"
                        className={cx(
                            "group inline-flex h-6 w-6 items-center justify-center rounded-full",
                            "border border-white/10 bg-black/20 text-xs text-neutral-200",
                            "hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                        )}
                        aria-label="Style help"
                    >
                      ?
                      <span
                          className={cx(
                              "pointer-events-none absolute right-0 top-full z-50 mt-2 w-72",
                              "rounded-xl border border-white/10 bg-[#0F1115]/95 px-3 py-2",
                              "text-[13px] leading-relaxed text-neutral-100 shadow-xl",
                              "opacity-0 translate-y-1 transition",
                              "group-hover:opacity-100 group-hover:translate-y-0",
                              "group-focus:opacity-100 group-focus:translate-y-0"
                          )}
                          role="tooltip"
                      >
                      {lang === "en"
                          ? "Minimal = clean B/W linework. Bold = RGB concept layers."
                          : "极简=黑白线稿。概念彩色=RGB 分层更强。"}
                    </span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-1 flex">
                  <button
                      type="button"
                      onClick={() => setStyle("minimal")}
                      className={cx(
                          "flex-1 rounded-lg px-3 py-2 text-sm transition",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
                          style === "minimal"
                              ? "bg-white/10 text-white"
                              : "text-neutral-300 hover:bg-white/5"
                      )}
                  >
                    {t.style.minimal}
                  </button>
                  <button
                      type="button"
                      onClick={() => setStyle("bold")}
                      className={cx(
                          "flex-1 rounded-lg px-3 py-2 text-sm transition",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
                          style === "bold"
                              ? "bg-white/10 text-white"
                              : "text-neutral-300 hover:bg-white/5"
                      )}
                  >
                    {t.style.bold}
                  </button>
                </div>

                <div className="mt-5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-neutral-200">{t.promptLabel}</div>
                    <div className="mt-1 text-[13px] leading-relaxed text-neutral-300">
                      {presetHint}
                    </div>
                  </div>

                  <div className="relative">
                    <button
                        type="button"
                        className={cx(
                            "group inline-flex h-6 w-6 items-center justify-center rounded-full",
                            "border border-white/10 bg-black/20 text-xs text-neutral-200",
                            "hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                        )}
                        aria-label="Prompt tip"
                    >
                      ?
                      <span
                          className={cx(
                              "pointer-events-none absolute right-0 top-full z-50 mt-2 w-80",
                              "rounded-xl border border-white/10 bg-[#0F1115]/95 px-3 py-2",
                              "text-[13px] leading-relaxed text-neutral-100 shadow-xl",
                              "opacity-0 translate-y-1 transition",
                              "group-hover:opacity-100 group-hover:translate-y-0",
                              "group-focus:opacity-100 group-focus:translate-y-0"
                          )}
                          role="tooltip"
                      >
                      {t.tip}
                    </span>
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <PromptPanel
                      value={prompt}
                      onChangeAction={(v) => {
                        setPrompt(v);
                        if (error === t.promptRequired || error === t.promptTooWeak) setError(null);
                      }}
                      language={lang}
                      maxChars={500}
                      placeholder={t.promptPlaceholder}
                      onStrengthChangeAction={setStrength}
                  />
                </div>

                <div className="mt-4">
                  <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerateDisabled}
                      className={cx(
                          "w-full inline-flex items-center justify-center gap-2",
                          "rounded-xl px-4 py-3 text-sm font-medium",
                          "bg-[#E6E7EB] text-[#0F1115]",
                          "transition will-change-transform",
                          "hover:bg-white active:scale-[0.98]",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                      aria-disabled={isGenerateDisabled}
                      title={
                        isPromptEmpty ? t.promptRequired : isStrengthTooLow ? t.promptTooWeak : undefined
                      }
                  >
                    {loading ? (
                        <>
                          <Spinner />
                          <span>{t.generating}</span>
                        </>
                    ) : (
                        <span>{t.generate}</span>
                    )}
                  </button>

                  {!loading && isPromptEmpty && (
                      <div className="mt-2 text-[13px] leading-relaxed text-neutral-300">
                        {t.promptRequired}
                      </div>
                  )}
                  {!loading && !isPromptEmpty && isStrengthTooLow && (
                      <div className="mt-2 text-[13px] leading-relaxed text-neutral-300">
                        {t.promptTooWeak}
                      </div>
                  )}

                  {error && (
                      <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                        {error}
                      </div>
                  )}
                </div>
              </div>
            </section>

            {/* BOTTOM: Results */}
            <section className="rounded-2xl border border-white/10 bg-[#16181D]/70 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-200">{t.results}</div>
                  <div className="text-xs text-neutral-400">
                    {loading ? t.loadingPanel : images.length ? "Click to download." : " "}
                  </div>
                </div>

                {loading && (
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <Spinner />
                      <span>{t.generating}</span>
                    </div>
                )}
              </div>

              {loading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-[320px] rounded-2xl border border-white/10 bg-white/5 animate-pulse"
                        />
                    ))}
                  </div>
              ) : images.length === 0 ? (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-white/15 bg-black/20 py-16">
                    <div className="text-center">
                      <div className="text-sm font-medium text-neutral-200">
                        {lang === "en" ? "No output yet" : "还没有输出"}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">{t.empty}</div>
                    </div>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {images.map((b64, idx) => {
                      const src = `data:image/png;base64,${b64}`;
                      return (
                          <div
                              key={idx}
                              className={cx(
                                  "group overflow-hidden rounded-2xl border border-white/10 bg-black/20",
                                  "transition hover:border-white/20"
                              )}
                          >
                            <img
                                src={src}
                                alt={`diagram-${idx + 1}`}
                                className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />

                            <div className="flex items-center justify-between px-3 py-2">
                              <div className="text-xs text-neutral-400">Diagram {idx + 1}</div>

                              <a
                                  href={src}
                                  download={`diagram-${idx + 1}.png`}
                                  className={cx(
                                      "rounded-md border border-white/10 px-2 py-1 text-xs transition",
                                      "hover:bg-white/10 active:scale-[0.98]",
                                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                                  )}
                              >
                                {t.download}
                              </a>
                            </div>
                          </div>
                      );
                    })}
                  </div>
              )}
            </section>
          </div>
        </main>
      </>
  );
}
