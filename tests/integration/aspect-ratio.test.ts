import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { build } from "../../src/cli/builder";
import { join } from "node:path";
import { rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const FIXTURES_DIR = join(import.meta.dir, "fixtures");
const OUTPUT_DIR = join(import.meta.dir, "aspect-output");

describe("Integration: Aspect Ratio Support", () => {
  beforeAll(async () => {
    if (existsSync(OUTPUT_DIR)) {
      await rm(OUTPUT_DIR, { recursive: true, force: true });
    }
    await mkdir(OUTPUT_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    if (existsSync(OUTPUT_DIR)) {
      await rm(OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  describe("16:9 Aspect Ratio", () => {
    it("should generate correct CSS variables for 16:9", async () => {
      const inputFile = join(FIXTURES_DIR, "aspect-16-9.md");
      const outputFile = join(OUTPUT_DIR, "aspect-16-9.html");

      await build(inputFile, {
        minify: false,
        outputPath: outputFile,
        autoOpen: false,
        help: false,
      });

      expect(existsSync(outputFile)).toBe(true);
      const html = await Bun.file(outputFile).text();

      // 16:9 should generate 1280x720
      expect(html).toContain("--slide-width: 1280px");
      expect(html).toContain("--slide-height: 720px");
    });
  });

  describe("4:3 Aspect Ratio", () => {
    it("should generate correct CSS variables for 4:3", async () => {
      const inputFile = join(FIXTURES_DIR, "complex.md");
      const outputFile = join(OUTPUT_DIR, "complex-4-3.html");

      await build(inputFile, {
        minify: false,
        outputPath: outputFile,
        autoOpen: false,
        help: false,
      });

      expect(existsSync(outputFile)).toBe(true);
      const html = await Bun.file(outputFile).text();

      // 4:3 should generate 960x720
      expect(html).toContain("--slide-width: 960px");
      expect(html).toContain("--slide-height: 720px");
    });
  });

  describe("1:1 Aspect Ratio", () => {
    it("should generate correct CSS variables for 1:1", async () => {
      const inputFile = join(FIXTURES_DIR, "aspect-1-1.md");
      const outputFile = join(OUTPUT_DIR, "aspect-1-1.html");

      await build(inputFile, {
        minify: false,
        outputPath: outputFile,
        autoOpen: false,
        help: false,
      });

      expect(existsSync(outputFile)).toBe(true);
      const html = await Bun.file(outputFile).text();

      // 1:1 should generate 720x720
      expect(html).toContain("--slide-width: 720px");
      expect(html).toContain("--slide-height: 720px");
    });
  });

  describe("Default Aspect Ratio", () => {
    it("should use 16:9 as default when aspectRatio is not specified", async () => {
      const fixtureContent = `---
title: No Aspect Ratio
---

# Default Slide

This should use 16:9.
`;
      const inputFile = join(OUTPUT_DIR, "no-aspect.md");
      const outputFile = join(OUTPUT_DIR, "no-aspect.html");

      await Bun.write(inputFile, fixtureContent);

      await build(inputFile, {
        minify: false,
        outputPath: outputFile,
        autoOpen: false,
        help: false,
      });

      expect(existsSync(outputFile)).toBe(true);
      const html = await Bun.file(outputFile).text();

      // Default should be 16:9 (1280x720)
      expect(html).toContain("--slide-width: 1280px");
      expect(html).toContain("--slide-height: 720px");
    });
  });
});
