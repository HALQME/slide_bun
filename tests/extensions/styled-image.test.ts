import { describe, it, expect, beforeEach } from "bun:test";
import { Marked } from "marked";
import { styledImageExtension } from "../../src/core/extensions/image";

describe("styledImageExtension", () => {
  let marked: Marked;

  beforeEach(() => {
    marked = new Marked();
    marked.use({ extensions: [styledImageExtension] });
  });

  it("should parse styled image", () => {
    const html = marked.parse("![alt](src.jpg){.rounded}");
    expect(html).toContain('<img class="rounded"');
    expect(html).toContain('src="src.jpg"');
    expect(html).toContain('alt="alt"');
  });

  it("should handle multiple classes", () => {
    const html = marked.parse("![alt](src.jpg){.class1 .class2}");
    expect(html).toContain('<img class="class1 class2"');
  });

  it("should handle numeric parameters correctly", () => {
    const html = marked.parse("![alt](src.jpg){.opacity 60}");
    expect(html).toContain('<img class="opacity-60"');

    const html2 = marked.parse("![alt](src.jpg){.fit .gray 80}");
    expect(html2).toContain('<img class="fit gray-80"');
  });
});
