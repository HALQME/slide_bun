import { Marked } from "marked";
import {
  styledHeadingExtension,
  styledSpanExtension,
  containerExtension,
  styledImageExtension,
  styledParagraphExtension,
} from "../core/extensions";
import { getSlideFontSizeAttribute } from "../core/layout-design";
import type { Presentation, PresentationMeta } from "../types";

// Constants
const DEFAULT_TITLE = "Untitled Presentation";
const DEFAULT_THEME = "default";

export class HTMLRenderer {
  private markedInstance: Marked;

  constructor() {
    this.markedInstance = this.createMarkedInstance();
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
    // Load theme CSS with fallback
    let themeCss: string;
    try {
      const themeModule = await Bun.file(`src/styles/themes/${theme}.css`).text();
      themeCss = themeModule;
    } catch {
      console.warn(`Theme "${theme}" not found, falling back to ${DEFAULT_THEME}`);
      themeCss = await Bun.file(`src/styles/themes/${DEFAULT_THEME}.css`).text();
    }

    // Load other assets
    const [utilitiesCss, printCss] = await Promise.all([
      Bun.file("src/styles/utilities.css").text(),
      Bun.file("src/styles/print.css").text(),
    ]);

    return {
      themeCss,
      utilitiesCss,
      printCss,
    };
  }

  private renderSlides(slides: Presentation["slides"]): string {
    return slides.map((slide) => this.renderSlide(slide)).join("\n");
  }

  private renderSlide(slide: Presentation["slides"][0]): string {
    const contentHtml = this.markedInstance.parser(slide.contentTokens);

    // Render speaker notes if available
    let notesHtml = "";
    if (slide.noteTokens && slide.noteTokens.length > 0) {
      notesHtml = `<div class="speaker-notes" hidden>${this.markedInstance.parser(slide.noteTokens)}</div>`;
    }

    // Calculate font-size based on content length
    const contentLength = slide.contentLength ?? 0;
    const fontSizeAttr = getSlideFontSizeAttribute(contentLength);

    return `
    <section class="slide" id="slide-${slide.id}" data-id="${slide.id}" style="${fontSizeAttr}">
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
    // Calculate initial scale to prevent flicker on load
    const initialScale = "1.0"; // Will be overridden by JS immediately, prevents flash
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <style>
    /* Theme: ${config.theme} */
    ${assets.themeCss}

    /* Fixed slide container - JS will apply scaling */
    #slide-container {
      width: 1280px;
      height: 720px;
      margin: 0 auto;
      position: relative;

      /* transform: scale() is applied by JavaScript to prevent flicker */
      transform-origin: center center;
      transform: scale(${initialScale});
    }

    /* Slides get font-size directly from content-based calculation */
    .slide {
      /* font-size is set inline based on content density */
    }

    /* Utilities */
    ${assets.utilitiesCss}

    /* Print Styles */
    ${assets.printCss}
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
  }
}
