import { describe, it, expect, beforeEach } from "bun:test";
import { Marked } from "marked";
import { containerExtension } from "../../src/core/extensions/container";

describe("containerExtension", () => {
  let marked: Marked;

  beforeEach(() => {
    marked = new Marked();
    marked.use({ extensions: [containerExtension] });
  });

  it("should parse speaker container", () => {
    const html = marked.parse("::: speaker\nNote content\n:::");
    expect(html).toContain('<div class="speaker">');
    expect(html).toContain("Note content");
  });

  it("should parse custom container", () => {
    const html = marked.parse("::: warning\nWarning message\n:::");
    expect(html).toContain('<div class="warning">');
    expect(html).toContain("Warning message");
  });
});
