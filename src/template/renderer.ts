import { Marked } from "marked";
import {
  styledHeadingExtension,
  styledSpanExtension,
  containerExtension,
  styledImageExtension,
  styledParagraphExtension,
} from "../core/extensions";
import { getSlideFontSizeAttribute } from "../core/layout-design";
import { HTMLMinifier } from "../utils/minifier";
import type { Presentation, PresentationMeta } from "../types";

// Constants
const DEFAULT_TITLE = "Untitled Presentation";
const DEFAULT_THEME = "default";

export class HTMLRenderer {
  private markedInstance: Marked;
  private minifier: HTMLMinifier;
  private enableMinify: boolean;

  constructor(options: { enableMinify?: boolean } = {}) {
    this.enableMinify = options.enableMinify ?? false;
    this.markedInstance = this.createMarkedInstance();
    this.minifier = new HTMLMinifier();
  }

  async generate(presentation: Presentation, runtimeScriptContent: string): Promise<string> {
    const { slides, meta } = presentation;
    const config = this.extractConfig(meta);

    const assets = await this.loadAssets(config.theme);
    const slidesHtml = this.renderSlides(slides);

    return this.buildHTML(config, assets, slidesHtml, runtimeScriptContent);
  }

  private createMarkedInstance(): Marked {
    const marked = new Marked();
    marked.use({
      extensions: [
        styledHeadingExtension,
        styledSpanExtension,
        containerExtension,
        styledImageExtension,
        styledParagraphExtension,
      ],
    });
    return marked;
  }

  private extractConfig(meta: PresentationMeta): { title: string; theme: string } {
    return {
      title: meta.title ?? DEFAULT_TITLE,
      theme: meta.theme ?? DEFAULT_THEME,
    };
  }

  private async loadAssets(theme: string) {
    // Load main CSS file and resolve @imports server-side
    let mainCss: string;
    try {
      mainCss = await Bun.file("src/styles/styles.css").text();
    } catch {
      throw new Error("Main CSS file not found: src/styles/styles.css");
    }

    // Check if the requested theme exists
    let themeToUse = theme;
    try {
      await Bun.file(`src/styles/themes/${theme}.css`).text();
    } catch {
      console.warn(`Theme "${theme}" not found, falling back to ${DEFAULT_THEME}`);
      themeToUse = DEFAULT_THEME;
    }

    // Resolve @import statements by reading the files and replacing them
    const importRegex = /@import url\("([^"]+)"\);/g;
    let resolvedCss = mainCss;
    const importPromises: Promise<{ original: string; content: string }>[] = [];

    const matches: Array<{ full: string; path: string }> = [];
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(mainCss)) !== null) {
      if (match[1]) {
        const importPath = match[1];
        const fullImportPath = `src/styles/${importPath}`;

        // For theme imports, use the resolved theme
        const actualImportPath = importPath.includes("themes/default.css")
          ? `src/styles/themes/${themeToUse}.css`
          : fullImportPath;

        matches.push({
          full: match[0],
          path: actualImportPath,
        });
      }
    }

    for (const { full, path } of matches) {
      importPromises.push(
        Bun.file(path)
          .text()
          .then((content) => {
            return { original: full, content };
          }),
      );
    }

    const resolvedImports = await Promise.all(importPromises);
    for (const resolved of resolvedImports) {
      resolvedCss = resolvedCss.replace(resolved.original, resolved.content);
    }

    // Load print styles separately
    const printCss = await Bun.file("src/styles/print.css").text();

    return {
      mainCss: resolvedCss,
      printCss,
      themeUsed: themeToUse,
    };
  }

  private renderSlides(slides: Presentation["slides"]): string {
    return slides.map((slide, index) => this.renderSlide(slide, index === 0)).join("\n");
  }

  private renderSlide(slide: Presentation["slides"][0], isFirst: boolean = false): string {
    const contentHtml = this.markedInstance.parser(slide.contentTokens);

    // Render speaker notes if available
    let notesHtml = "";
    if (slide.noteTokens && slide.noteTokens.length > 0) {
      notesHtml = `<div class="speaker-notes" hidden>${this.markedInstance.parser(slide.noteTokens)}</div>`;
    }

    // Calculate font-size based on content length
    const contentLength = slide.contentLength ?? 0;
    const fontSizeAttr = getSlideFontSizeAttribute(contentLength);

    // Add active class to the first slide
    const activeClass = isFirst ? " active" : "";

    return `
    <section class="slide${activeClass}" id="slide-${slide.id}" data-id="${slide.id}" style="${fontSizeAttr}">
      ${contentHtml}
      ${notesHtml}
    </section>
    `.trim();
  }

  private buildHTML(
    config: { title: string; theme: string },
    assets: Awaited<ReturnType<typeof this.loadAssets>>,
    slidesHtml: string,
    runtimeScript: string,
  ): string {
    // Minify CSS assets
    const minifiedMainCss = this.minifier.minifyCSS(assets.mainCss);
    const minifiedPrintCss = this.minifier.minifyCSS(assets.printCss);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.title}</title>
<style>
/* Theme: ${assets.themeUsed} */
${minifiedMainCss}${minifiedPrintCss}
</style>
</head>
<body>
<div class="slide-viewport">
<div id="slide-container">
${slidesHtml}
</div>
</div>
<script>
${runtimeScript}
</script>
</body>
</html>`;

    // Always remove HTML comments (regardless of minify setting)
    const simplifyed = this.minifier.removeComments(html).replace(/^(\s+|\t)/gm, "");

    // Minify final HTML if enabled
    return this.enableMinify ? this.minifier.minify(simplifyed) : simplifyed;
  }
}
