/**
 * Tests for attrsToClass and parseAttrsToTokens behavior.
 *
 * These verify the parsing rules for attribute strings like:
 *   ".opacity 60 .gray 80 .mark .border"
 *
 * Spec highlights:
 * - Numeric-parameter classes (opacity, gray) accept an integer 0..100 when provided:
 *     {.opacity 60} -> opacity-60
 * - If numeric class is provided without a numeric value, fallback to 50:
 *     {.opacity} -> opacity-50
 * - If a non-numeric class is followed by a number, the number is ignored:
 *     {.mark 10} -> mark
 * - Explicit hyphenated classes like .opacity-60 are accepted and clamped to 0..100
 * - Stray numeric tokens with no preceding class are ignored
 */

import { describe, it, expect } from "bun:test";
import { attrsToClass, parseAttrsToTokens } from "../../src/core/extensions/classUtils";

describe("classUtils.attrsToClass", () => {
  it("should handle simple classes without dots", () => {
    expect(attrsToClass("mark border")).toBe("mark border");
  });

  it("should handle simple classes with leading dots", () => {
    expect(attrsToClass(".mark .border")).toBe("mark border");
  });

  it("should parse numeric classes with values", () => {
    expect(attrsToClass(".opacity 60 .gray 80")).toBe("opacity-60 gray-80");
  });

  it("should fallback to 50 when numeric class is provided without a number", () => {
    expect(attrsToClass(".opacity .gray")).toBe("opacity-50 gray-50");
  });

  it("should ignore numeric tokens after non-numeric classes", () => {
    // '10' and '20' are stray numbers after classes that don't accept numbers -> ignored
    expect(attrsToClass(".mark 10 .border 20")).toBe("mark border");
  });

  it("should accept explicit hyphenated classes and clamp numeric value", () => {
    expect(attrsToClass(".opacity-60 .gray-80")).toBe("opacity-60 gray-80");
    // too large value gets clamped to 100
    expect(attrsToClass(".opacity-999")).toBe("opacity-100");
    // explicit numeric class with small value preserved
    expect(attrsToClass("opacity-0")).toBe("opacity-0");
  });

  it("should clamp numeric values to 0..100 when provided after class", () => {
    // 999 -> clamp to 100; -20 is not a digit-only token, so treated as missing -> fallback 50
    expect(attrsToClass(".opacity 999 .gray -20")).toBe("opacity-100 gray-50");
  });

  it("should ignore stray leading numbers", () => {
    expect(attrsToClass("60 .mark")).toBe("mark");
    // multiple stray numbers should be ignored
    expect(attrsToClass("10 20 30 .mark")).toBe("mark");
  });

  it("should deduplicate identical classes while preserving order", () => {
    // second 'mark' ignored due to dedupe
    expect(attrsToClass(".mark .border .mark")).toBe("mark border");
  });

  it("should tolerate mixed dot/no-dot tokens", () => {
    expect(attrsToClass("opacity 60 .gray 80 mark")).toBe("opacity-60 gray-80 mark");
  });

  it("should produce empty string for empty input", () => {
    expect(attrsToClass("")).toBe("");
    expect(attrsToClass("   ")).toBe("");
  });
});

describe("classUtils.parseAttrsToTokens", () => {
  it("should return structured tokens for mixed input", () => {
    const tokens = parseAttrsToTokens(".opacity 60 .mark .gray");
    // order should be preserved and opacity should have value 60, gray missing value -> fallback 50
    expect(tokens).toEqual([
      { name: "opacity", value: 60 },
      { name: "mark" },
      { name: "gray", value: 50 },
    ]);
  });

  it("should parse explicit hyphenated numeric classes to tokens with values", () => {
    const tokens = parseAttrsToTokens(".opacity-80 .border");
    expect(tokens).toEqual([{ name: "opacity", value: 80 }, { name: "border" }]);
  });

  it("should ignore stray numeric tokens", () => {
    const tokens = parseAttrsToTokens("10 20 .mark 30");
    // stray 10 and 20 ignored; 30 after .mark is ignored because mark doesn't accept numeric
    expect(tokens).toEqual([{ name: "mark" }]);
  });

  it("should use fallback value for numeric classes without a number", () => {
    const tokens = parseAttrsToTokens(".opacity .gray");
    expect(tokens).toEqual([
      { name: "opacity", value: 50 },
      { name: "gray", value: 50 },
    ]);
  });
});
