import { describe, it, expect } from "bun:test";
import { parseArguments, getOutputPath, validateInputFile, showHelp } from "../../src/cli/utils";
import { join } from "node:path";
import { unlinkSync, writeFileSync } from "node:fs";

describe("CLI Utils", () => {
  describe("parseArguments", () => {
    it("should parse input path correctly", () => {
      const { inputPath } = parseArguments(["input.md"]);
      expect(inputPath).toBe("input.md");
    });

    it("should parse options correctly", () => {
      const { options } = parseArguments(["input.md", "--minify", "--auto-open"]);
      expect(options.minify).toBe(true);
      expect(options.autoOpen).toBe(true);
    });

    it("should parse output path", () => {
      const { options } = parseArguments(["input.md", "-o", "out.html"]);
      expect(options.outputPath).toBe("out.html");
    });

    it("should throw error if input missing", () => {
      expect(() => parseArguments([])).toThrow("Error: Input file is required");
    });

    it("should throw error if output path missing after -o", () => {
      expect(() => parseArguments(["input.md", "-o"])).toThrow(
        "Error: --output requires a file path",
      );
    });

    it("should handle unknown options", () => {
      expect(() => parseArguments(["input.md", "--unknown"])).toThrow(
        "Error: Unknown option --unknown",
      );
    });

    it("should handle help option without input", () => {
      const { options } = parseArguments(["--help"]);
      expect(options.help).toBe(true);
    });
  });

  describe("getOutputPath", () => {
    it("should return absolute path based on input", () => {
      const result = getOutputPath("test.md", { autoOpen: false, help: false });
      expect(result).toBe(join(process.cwd(), "test.html"));
    });

    it("should return provided output path", () => {
      const result = getOutputPath("test.md", {
        outputPath: "custom.html",
        autoOpen: false,
        help: false,
      });
      expect(result).toBe(join(process.cwd(), "custom.html"));
    });
  });

  describe("validateInputFile", () => {
    const tempFile = "temp_valid_test.md";

    it("should return absolute path if file exists", () => {
      writeFileSync(tempFile, "test");
      const result = validateInputFile(tempFile);
      expect(result).toBe(join(process.cwd(), tempFile));
      unlinkSync(tempFile);
    });

    it("should throw if file does not exist", () => {
      expect(() => validateInputFile("non_existent.md")).toThrow("File not found");
    });
  });

  describe("showHelp", () => {
    it("should return help string", () => {
      expect(showHelp()).toContain("Usage:");
    });
  });
});
