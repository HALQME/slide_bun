import { describe, it, expect } from "bun:test";
import { splitTokensToSlides } from "../../src/core/splitter";
import type { Token } from "marked";

describe("splitTokensToSlides", () => {
  it("should handle empty input", () => {
    const result = splitTokensToSlides([]);
    expect(result).toEqual([]);
  });

  it("should create single slide from content", () => {
    const tokens = [{ type: "paragraph", raw: "Hello", text: "Hello" } as any];
    const result = splitTokensToSlides(tokens);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(1);
    expect(result[0]!.contentTokens).toEqual(tokens);
  });

  it("should split at HR tokens", () => {
    const tokens = [
      { type: "paragraph", raw: "Slide 1", text: "Slide 1" } as any,
      { type: "hr", raw: "---" } as Token,
      { type: "paragraph", raw: "Slide 2", text: "Slide 2" } as any,
    ];
    const result = splitTokensToSlides(tokens);

    expect(result).toHaveLength(2);
    expect((result[0]!.contentTokens[0] as any).text).toBe("Slide 1");
    expect((result[1]!.contentTokens[0] as any).text).toBe("Slide 2");
  });

  it("should extract speaker notes", () => {
    const tokens = [
      { type: "paragraph", raw: "Content", text: "Content" } as any,
      {
        type: "container",
        kind: "speaker",
        tokens: [{ type: "paragraph", raw: "Note", text: "Note" } as any],
      } as any,
    ];
    const result = splitTokensToSlides(tokens);

    expect(result[0]!.contentTokens).toHaveLength(1);
    expect(result[0]!.noteTokens).toHaveLength(1);
  });

  it("should increment slide IDs correctly", () => {
    const tokens = [
      { type: "paragraph", raw: "Slide 1", text: "Slide 1" } as any,
      { type: "hr", raw: "---" } as Token,
      { type: "paragraph", raw: "Slide 2", text: "Slide 2" } as any,
    ];
    const result = splitTokensToSlides(tokens);

    expect(result[0]!.id).toBe(1);
    expect(result[1]!.id).toBe(2);
  });
});
