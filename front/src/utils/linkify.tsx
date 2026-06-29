import { Fragment, type ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,;:!?"')\]}>])/gi;

/**
 * Plain text with http(s) URLs rendered as clickable links.
 */
export function renderTextWithLinks(text: string): ReactNode {
  const parts: { type: "text" | "url"; value: string }[] = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "url", value: match[0] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return text;
  }

  return parts.map((part, i) =>
    part.type === "url" ? (
      <a
        key={i}
        href={part.value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline break-all hover:text-blue-800"
      >
        {part.value}
      </a>
    ) : (
      <Fragment key={i}>{part.value}</Fragment>
    ),
  );
}
