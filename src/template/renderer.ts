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
import path from "node:path";

import { themes, styles } from "./styles";

// Constants
const DEFAULT_TITLE = "Untitled Presentation";
const DEFAULT_THEME = "default";

export class HTMLRenderer {
  private markedInstance: Marked;
  private minifier: HTMLMinifier;
  private enableMinify: boolean;
  private inlineAssets: boolean;

  constructor(options: { enableMinify?: boolean; inlineAssets?: boolean } = {}) {
    this.enableMinify = options.enableMinify ?? false;
    this.inlineAssets = options.inlineAssets ?? true;
    this.markedInstance = this.createMarkedInstance();
    this.minifier = new HTMLMinifier();
  }

  /**
   * When inlineAssets is true this returns a string of full HTML.
   * When inlineAssets is false this returns an object containing html and assets (CSS) kept in memory
   */
  async generate(
    presentation: Presentation,
    runtimeScriptContent: string,
  ): Promise<
    string | { html: string; assets: { mainCss: string; printCss: string; themeCss: string } }
  > {
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

  private extractConfig(meta: PresentationMeta): {
    title: string;
    theme: string;
    fontSize: string;
  } {
    return {
      title: meta.title ?? DEFAULT_TITLE,
      theme: meta.theme ?? DEFAULT_THEME,
      fontSize: meta.fontSize ? `font-size-${meta.fontSize.toLowerCase()}` : "",
    };
  }

  private resolve = (filepath: string) => path.resolve(path.dirname(Bun.main), filepath);

  private async loadAssets(theme: string) {
    const mainCss = await Bun.file(this.resolve(styles.base)).text();

    // Theme Style (Fallback Default);
    const themeUsed =
      theme in themes && themes[theme as keyof typeof themes]
        ? await Bun.file(this.resolve(themes[theme as keyof typeof themes])).text()
        : await Bun.file(this.resolve(themes.default)).text();

    // Style For export PDF
    const printCss = await Bun.file(this.resolve(styles.print)).text();

    return {
      mainCss,
      printCss,
      themeUsed,
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
    config: { title: string; theme: string; fontSize: string },
    assets: Awaited<ReturnType<typeof this.loadAssets>>,
    slidesHtml: string,
    runtimeScript: string,
  ): string | { html: string; assets: { mainCss: string; printCss: string; themeCss: string } } {
    // Minify CSS assets
    const minifiedThemeCss = this.minifier.minifyCSS(assets.themeUsed);
    const minifiedMainCss = this.minifier.minifyCSS(assets.mainCss);
    const minifiedPrintCss = this.minifier.minifyCSS(assets.printCss);

    if (this.inlineAssets) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.title}</title>
<style>
${minifiedThemeCss}${minifiedMainCss}${minifiedPrintCss}
</style>
</head>
<body${config.fontSize ? ` class="${config.fontSize}"` : ""}>
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

    // Externalize assets: return HTML that links to static asset paths and include minified CSS in the returned assets
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.title}</title>
<link rel="stylesheet" href="/assets/styles.css">
<link rel="stylesheet" href="/assets/theme.css">
<link rel="stylesheet" href="/assets/print.css" media="print">
</head>
<body${config.fontSize ? ` class="${config.fontSize}"` : ""}>
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

    const simplifyed = this.minifier.removeComments(html).replace(/^(\s+|\t)/gm, "");
    const finalHtml = this.enableMinify ? this.minifier.minify(simplifyed) : simplifyed;

    return {
      html: finalHtml,
      assets: {
        mainCss: minifiedMainCss,
        printCss: minifiedPrintCss,
        themeCss: minifiedThemeCss,
      },
    };
  }
}
