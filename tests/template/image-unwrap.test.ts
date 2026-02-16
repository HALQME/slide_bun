import { describe, it, expect, beforeEach } from "bun:test";
import { HTMLRenderer } from "../../src/template/renderer";
import { MarkdownParser } from "../../src/core/parser";

describe("HTMLRenderer Image Handling", () => {
  let renderer: HTMLRenderer;
  let parser: MarkdownParser;

  beforeEach(() => {
    renderer = new HTMLRenderer();
    parser = new MarkdownParser();
  });

  it("should unwrap simple images from paragraphs", () => {
    const md = "![alt](img.png)";
    const presentation = parser.parse(md);

    // Create a minimal runtime script string
    const result = renderer["renderSlide"](presentation.slides[0]!);

    // Should contain img tag but NOT p tag wrapping it
    expect(result).toContain('<img src="img.png" alt="alt">');
    expect(result).not.toMatch(/<p>\s*<img/);
  });

  it("should unwrap styled images from paragraphs", () => {
    const md = "![alt](img.png){.fit}";
    const presentation = parser.parse(md);

    const result = renderer["renderSlide"](presentation.slides[0]!);

    expect(result).toContain('<img class="fit" src="img.png" alt="alt">');
    expect(result).not.toMatch(/<p>\s*<img/);
  });

  it("should KEEP paragraphs for text + image", () => {
    const md = "text ![alt](img.png)";
    const presentation = parser.parse(md);

    const result = renderer["renderSlide"](presentation.slides[0]!);

    expect(result).toMatch(/<p>.*<img/);
  });
});
