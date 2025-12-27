"use client";

import React from "react";

export default function Tooltip({
                                    text,
                                    className,
                                }: {
    text: string;
    className?: string;
}) {
    return (
        <span className={"relative inline-flex items-center " + (className ?? "")}>
      <span
          className="group inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/20 text-[11px] text-neutral-200"
          tabIndex={0}
          aria-label="help"
      >
        ?
        <span
            className={[
                "pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2",
                "rounded-xl border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-xs text-neutral-200",
                "opacity-0 translate-y-1 transition",
                "group-hover:opacity-100 group-hover:translate-y-0",
                "group-focus:opacity-100 group-focus:translate-y-0",
                "shadow-xl",
            ].join(" ")}
            role="tooltip"
        >
          {text}
        </span>
      </span>
    </span>
    );
}
