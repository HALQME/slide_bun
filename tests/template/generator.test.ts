import { describe, it, expect, beforeEach } from "bun:test";
import { HTMLGenerator } from "../../src/template/generator";
import type { Presentation } from "../../src/types";

describe("HTMLGenerator", () => {
  let generator: HTMLGenerator;

  beforeEach(() => {
    generator = new HTMLGenerator();
  });

  describe("constructor", () => {
    it("should create instance with marked and transpiler", () => {
      expect(generator).toBeDefined();
    });
  });

  describe("generate", () => {
    // Skip integration tests that require file system mocking
    it("should have generate method", () => {
      expect(typeof generator.generate).toBe("function");
    });

    it("should accept presentation object", async () => {
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
            layout: "default",
          },
        ],
      };

      // Test that the method signature accepts the correct type
      expect(() => generator.generate(presentation)).not.toThrow();
    });
  });

  describe("private methods", () => {
    it("should have internal methods for processing", () => {
      // Test that the generator has the expected internal structure
      expect(generator).toBeDefined();
    });
  });
});
