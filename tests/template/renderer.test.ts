import { describe, it, expect, beforeEach } from "bun:test";
import { HTMLRenderer } from "../../src/template/renderer";
import type { Presentation } from "../../src/types";

describe("HTMLRenderer", () => {
  let renderer: HTMLRenderer;

  beforeEach(() => {
    renderer = new HTMLRenderer();
  });

  describe("constructor", () => {
    it("should create instance", () => {
      expect(renderer).toBeDefined();
    });
  });

  describe("generate", () => {
    it("should have generate method", () => {
      expect(typeof renderer.generate).toBe("function");
    });

    it("should accept presentation object and runtime", async () => {
      const presentation: Presentation = {
        meta: {
          title: "Test Presentation",
          theme: "default",
        },
        slides: [
          {
            id: 1,
            contentTokens: [],
            noteTokens: [],
          },
        ],
      };

      // Test that the method signature accepts the correct type
      // Passing empty string as runtime script
      const result = await renderer.generate(presentation, "");
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });
});
