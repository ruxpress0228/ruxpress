import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderTextWithLinks } from "./linkify";

describe("renderTextWithLinks", () => {
  it("renders plain text unchanged", () => {
    expect(renderToStaticMarkup(<>{renderTextWithLinks("hello world")}</>)).toBe("hello world");
  });

  it("wraps http(s) URLs in anchor tags", () => {
    const html = renderToStaticMarkup(
      <>{renderTextWithLinks("https://t.me/+tTSOGcA21OFhNGZI")}</>,
    );
    expect(html).toContain('href="https://t.me/+tTSOGcA21OFhNGZI"');
    expect(html).toContain(">https://t.me/+tTSOGcA21OFhNGZI<");
  });

  it("linkifies URLs embedded in text", () => {
    const html = renderToStaticMarkup(
      <>{renderTextWithLinks("Visit https://example.com for more info")}</>,
    );
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("Visit ");
    expect(html).toContain(" for more info");
  });
});
