import { describe, it, expect, beforeEach } from "bun:test";
import { Marked } from "marked";
import { styledSpanExtension } from "../../src/core/extensions/inline";

describe("styledSpanExtension", () => {
  let marked: Marked;

  beforeEach(() => {
    marked = new Marked();
    marked.use({ extensions: [styledSpanExtension] });
  });

  it("should parse styled span", () => {
    const html = marked.parse("[Text]{.red}");
    expect(html).toContain('<span class="red">Text</span>');
  });

  it("should handle multiple classes", () => {
    const html = marked.parse("[Text]{.class1 .class2}");
    expect(html).toContain('<span class="class1 class2">Text</span>');
  });
});
