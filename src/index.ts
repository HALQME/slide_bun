// Core modules
export { MarkdownParser, parseMarkdown } from "./core/parser.js";
export { splitTokensToSlides } from "./core/splitter.js";

// Extensions
export {
  styledHeadingExtension,
  styledParagraphExtension,
  type StyledHeadingToken,
  type StyledParagraphToken,
} from "./core/extensions/block.js";

export { styledSpanExtension, type StyledSpanToken } from "./core/extensions/inline.js";

export { containerExtension, type ContainerToken } from "./core/extensions/container.js";

export { styledImageExtension, type StyledImageToken } from "./core/extensions/image.js";

export * from "./core/extensions/index.js";

// Template and generation
export { HTMLGenerator } from "./template/generator.js";

// Client runtime
export * from "./client/runtime.js";

// Types
export * from "./types/index.js";

// CLI utilities
export * from "./cli/utils.js";
export { build } from "./cli/builder.js";
export * from "./cli/index.js";

/**
 * Main API entry point - parse markdown and generate HTML
 */
export async function generateSlides(
  markdown: string,
  options?: {
    theme?: string;
    title?: string;
    outputPath?: string;
  },
): Promise<string> {
  const parser = new (await import("./core/parser.js")).MarkdownParser();
  const presentation = parser.parse(markdown);

  const generator = new (await import("./template/generator.js")).HTMLGenerator();

  // Override meta with options
  if (options?.theme) {
    presentation.meta.theme = options.theme;
  }
  if (options?.title) {
    presentation.meta.title = options.title;
  }

  return generator.generate(presentation);
}

/**
 * Parse markdown to presentation object
 */
export async function parseSlides(
  markdown: string,
): Promise<import("./types/index.js").Presentation> {
  const parser = new (await import("./core/parser.js")).MarkdownParser();
  return parser.parse(markdown);
}

/**
 * Generate HTML from presentation object
 */
export async function generateHTML(
  presentation: import("./types/index.js").Presentation,
  options?: {
    theme?: string;
    title?: string;
  },
): Promise<string> {
  const generator = new (await import("./template/generator.js")).HTMLGenerator();

  // Override meta with options
  if (options?.theme) {
    presentation.meta.theme = options.theme;
  }
  if (options?.title) {
    presentation.meta.title = options.title;
  }

  return generator.generate(presentation);
}
