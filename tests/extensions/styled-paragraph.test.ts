import { describe, it, expect, beforeEach } from "bun:test";
import { Marked } from "marked";
import {
  styledParagraphExtension,
  type StyledParagraphToken,
} from "../../src/core/extensions/block";

describe("styledParagraphExtension", () => {
  let marked: Marked;

  beforeEach(() => {
    marked = new Marked();
    marked.use({ extensions: [styledParagraphExtension] });
  });

  it("should parse styled paragraph", () => {
    const tokens = marked.lexer("Styled text {.my-class}");
    const token = tokens[0] as StyledParagraphToken;

    expect(token.type).toBe("styledParagraph");
    expect(token.text).toBe("Styled text");
    expect(token.attrs).toBe(".my-class");
  });

  it("should render styled paragraph", () => {
    const html = marked.parse("Styled text {.my-class}");
    expect(html).toContain('<p class="my-class">Styled text</p>');
  });

  it("should not match headings", () => {
    const tokens = marked.lexer("# Title {.class}");
    expect(tokens[0]!.type).not.toBe("styledParagraph");
  });

  it("should not match containers", () => {
    const tokens = marked.lexer("::: container {.class}");
    expect(tokens[0]!.type).not.toBe("styledParagraph");
  });
});
