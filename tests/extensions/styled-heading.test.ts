import { describe, it, expect, beforeEach } from "bun:test";
import { Marked } from "marked";
import { styledHeadingExtension, type StyledHeadingToken } from "../../src/core/extensions/block";

describe("styledHeadingExtension", () => {
  let marked: Marked;

  beforeEach(() => {
    marked = new Marked();
    marked.use({ extensions: [styledHeadingExtension] });
  });

  it("should parse styled heading", () => {
    const tokens = marked.lexer("# Title {.center}");
    const token = tokens[0] as StyledHeadingToken;

    expect(token.type).toBe("styledHeading");
    expect(token.depth).toBe(1);
    expect(token.text).toBe("Title");
    expect(token.attrs).toBe(".center");
  });

  it("should render styled heading", () => {
    const html = marked.parse("# Title {.center}");
    expect(html).toContain('<h1 class="center">Title</h1>');
  });

  it("should handle different heading levels", () => {
    for (let level = 1; level <= 6; level++) {
      const markdown = "#".repeat(level) + " Title {.class}";
      const tokens = marked.lexer(markdown);
      const token = tokens[0] as StyledHeadingToken;
      expect(token.depth).toBe(level);
    }
  });

  it("should not match regular headings", () => {
    const tokens = marked.lexer("# Regular title");
    expect(tokens[0]!.type).toBe("heading");
  });
});
