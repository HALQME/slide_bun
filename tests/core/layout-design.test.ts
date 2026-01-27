import { describe, it, expect } from "bun:test";
import {
  getContentDensity,
  calculateFontScale,
  getSlideStyleAttribute,
  SLIDE_DIMENSIONS,
  LAYOUT_RECOMMENDATIONS,
  type LayoutType,
  type ContentDensity,
} from "../../src/core/layout-design";

describe("Layout Design System", () => {
  describe("getContentDensity", () => {
    it("should classify sparse content (< 100 chars)", () => {
      expect(getContentDensity(50)).toBe("sparse");
      expect(getContentDensity(99)).toBe("sparse");
    });

    it("should classify normal content (100-299 chars)", () => {
      expect(getContentDensity(100)).toBe("normal");
      expect(getContentDensity(200)).toBe("normal");
      expect(getContentDensity(299)).toBe("normal");
    });

    it("should classify dense content (300-599 chars)", () => {
      expect(getContentDensity(300)).toBe("dense");
      expect(getContentDensity(450)).toBe("dense");
      expect(getContentDensity(599)).toBe("dense");
    });

    it("should classify very-dense content (600+ chars)", () => {
      expect(getContentDensity(600)).toBe("very-dense");
      expect(getContentDensity(1000)).toBe("very-dense");
    });
  });

  describe("calculateFontScale", () => {
    it("should return larger scale for sparse content", () => {
      const sparse = calculateFontScale("default", "sparse");
      const dense = calculateFontScale("default", "dense");
      expect(sparse).toBeGreaterThan(dense);
    });

    it("should return base scale for normal content", () => {
      const normal = calculateFontScale("default", "normal");
      expect(normal).toBe(1);
    });

    it("should apply layout-specific scaling", () => {
      const defaultLayout = calculateFontScale("default", "normal");
      const centerLayout = calculateFontScale("center", "normal");
      const columnsLayout = calculateFontScale("columns", "normal");

      // center should be larger than default
      expect(centerLayout).toBeGreaterThan(defaultLayout);
      // columns should be smaller than default
      expect(columnsLayout).toBeLessThan(defaultLayout);
    });

    it("should handle all layout types", () => {
      const layouts: LayoutType[] = ["default", "center", "columns", "cover"];
      for (const layout of layouts) {
        const scale = calculateFontScale(layout, "normal");
        expect(scale).toBeGreaterThan(0);
      }
    });

    it("should handle all density types", () => {
      const densities: ContentDensity[] = ["sparse", "normal", "dense", "very-dense"];
      for (const density of densities) {
        const scale = calculateFontScale("default", density);
        expect(scale).toBeGreaterThan(0);
      }
    });

    it("should return rounded values", () => {
      // Font scales should be rounded to at most three decimal places
      const scale = calculateFontScale("default", "normal");
      const decimalPlaces = (scale.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(3);
    });
  });

  describe("getSlideStyleAttribute", () => {
    it("should return CSS custom property format", () => {
      const style = getSlideStyleAttribute("default", 150);
      // now returns a scale property without px units, e.g. "--slide-font-scale: 1.2"
      expect(style).toMatch(/^--slide-font-scale: \d+(\.\d+)?$/);
    });

    it("should generate different styles for different content lengths", () => {
      const shortStyle = getSlideStyleAttribute("default", 50);
      const longStyle = getSlideStyleAttribute("default", 800);
      expect(shortStyle).not.toBe(longStyle);
    });

    it("should apply layout-specific styling", () => {
      const defaultStyle = getSlideStyleAttribute("default", 200);
      const centerStyle = getSlideStyleAttribute("center", 200);
      expect(defaultStyle).not.toBe(centerStyle);
    });
  });

  describe("SLIDE_DIMENSIONS", () => {
    it("should have correct base dimensions for 16:9 aspect ratio", () => {
      expect(SLIDE_DIMENSIONS.baseWidth).toBe(1280);
      expect(SLIDE_DIMENSIONS.baseHeight).toBe(720);
      expect(SLIDE_DIMENSIONS.aspectRatio).toBe("16/9");
    });

    it("should have padding configuration", () => {
      expect(SLIDE_DIMENSIONS.padding).toBe(32);
    });
  });

  describe("LAYOUT_RECOMMENDATIONS", () => {
    it("should have content length ranges for all densities", () => {
      const ranges = LAYOUT_RECOMMENDATIONS.contentLengthRanges;
      expect(ranges.sparse).toBeDefined();
      expect(ranges.normal).toBeDefined();
      expect(ranges.dense).toBeDefined();
      expect(ranges["very-dense"]).toBeDefined();
    });

    it("should have recommendations for all layout types", () => {
      const layouts = LAYOUT_RECOMMENDATIONS.layouts;
      expect(layouts.default).toBeDefined();
      expect(layouts.center).toBeDefined();
      expect(layouts.columns).toBeDefined();
      expect(layouts.cover).toBeDefined();
    });

    it("should provide descriptive information for each layout", () => {
      for (const layout of Object.values(LAYOUT_RECOMMENDATIONS.layouts)) {
        expect(layout.description).toBeDefined();
        expect(layout.bestFor).toBeDefined();
        expect(Array.isArray(layout.bestFor)).toBe(true);
        expect(layout.maxContentLength).toBeDefined();
      }
    });
  });

  describe("Integration test: sparse vs very-dense content", () => {
    it("should significantly scale down font for very dense content", () => {
      const sparseStyle = getSlideStyleAttribute("default", 50);
      const denseStyle = getSlideStyleAttribute("default", 1000);

      // Extract font sizes from style strings
      const sparseFontSize = parseFloat(sparseStyle.match(/\d+(\.\d)?/)![0]);
      const denseFontSize = parseFloat(denseStyle.match(/\d+(\.\d)?/)![0]);

      expect(sparseFontSize).toBeGreaterThan(denseFontSize);
    });
  });
});
