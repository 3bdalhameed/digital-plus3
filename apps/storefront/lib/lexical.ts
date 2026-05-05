// Simple Lexical JSON → HTML serializer for Payload v2 richText fields

type LexicalNode = {
  type: string;
  tag?: string;
  format?: number;
  text?: string;
  url?: string;
  target?: string;
  listType?: "bullet" | "number";
  children?: LexicalNode[];
};

const FORMAT = { BOLD: 1, ITALIC: 2, STRIKETHROUGH: 4, UNDERLINE: 8, CODE: 16 };

function serializeNode(node: LexicalNode): string {
  if (node.type === "text") {
    let html = (node.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const f = node.format ?? 0;
    if (f & FORMAT.CODE)          html = `<code>${html}</code>`;
    if (f & FORMAT.BOLD)          html = `<strong>${html}</strong>`;
    if (f & FORMAT.ITALIC)        html = `<em>${html}</em>`;
    if (f & FORMAT.UNDERLINE)     html = `<u>${html}</u>`;
    if (f & FORMAT.STRIKETHROUGH) html = `<s>${html}</s>`;
    return html;
  }

  if (node.type === "linebreak") return "<br/>";

  const inner = (node.children ?? []).map(serializeNode).join("");

  switch (node.type) {
    case "paragraph": return `<p>${inner || "<br/>"}</p>`;
    case "heading":   return `<${node.tag}>${inner}</${node.tag}>`;
    case "list":      return node.listType === "number" ? `<ol>${inner}</ol>` : `<ul>${inner}</ul>`;
    case "listitem":  return `<li>${inner}</li>`;
    case "link":      return `<a href="${node.url ?? "#"}" target="${node.target ?? "_self"}" rel="noopener noreferrer">${inner}</a>`;
    case "quote":     return `<blockquote>${inner}</blockquote>`;
    case "root":      return inner;
    default:          return inner;
  }
}

export function lexicalToHtml(content: any): string {
  if (!content || typeof content !== "object") return "";
  try {
    const root: LexicalNode = content.root ?? content;
    return serializeNode(root);
  } catch {
    return "";
  }
}
