// @ts-nocheck
import React from "react";

/**
 * Universal row-label component for array fields.
 * Looks through common preview-worthy keys on the row's data and returns
 * the first non-empty string it finds. Falls back to "العنصر N" (Item N).
 *
 * Use as:
 *   admin: { components: { RowLabel: ArrayRowLabel } }
 *
 * The priority order covers every array field in HomePage.ts:
 *   slides       -> title / subtitle
 *   banners      -> (no text field; falls back to index)
 *   items        -> title / label / question
 *   stats        -> label / value
 *   testimonials -> name
 *   faq          -> question
 *   tabs         -> label
 */
const PREVIEW_KEYS = [
  "title",
  "label",
  "name",
  "question",
  "value",
  "text",
  "ctaLabel",
];

const ArrayRowLabel: React.FC<{ data?: any; index?: number; path?: string }> = ({
  data,
  index,
}) => {
  const num = String((index ?? 0) + 1).padStart(2, "0");

  let preview: string | undefined;
  if (data && typeof data === "object") {
    for (const key of PREVIEW_KEYS) {
      const v = (data as any)[key];
      if (typeof v === "string" && v.trim()) {
        preview = v.trim();
        break;
      }
    }
  }

  if (!preview) return <span>{`العنصر ${num}`}</span>;

  // Truncate long previews so the row header stays compact
  const trimmed = preview.length > 60 ? preview.slice(0, 60) + "…" : preview;

  // Wrap the Latin number in an isolated bidi span so it doesn't
  // get reordered by the surrounding Arabic preview text. Without
  // isolation, a number like "01" followed by Arabic gets visually
  // pushed around when the row label is rendered inside an RTL flow.
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        dir="ltr"
        style={{
          color: "#7C3AED",
          fontWeight: 700,
          unicodeBidi: "isolate",
        }}
      >
        {num}
      </span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span style={{ unicodeBidi: "isolate" }}>{trimmed}</span>
    </span>
  );
};

export default ArrayRowLabel;
