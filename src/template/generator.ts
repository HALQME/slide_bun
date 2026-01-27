import { Marked } from "marked";
import {
  styledHeadingExtension,
  styledSpanExtension,
  containerExtension,
  styledImageExtension,
  styledParagraphExtension,
} from "../core/extensions";
import type { Presentation, PresentationMeta } from "../types";

// Constants
const DEFAULT_TITLE = "Untitled Presentation";
const DEFAULT_THEME = "default";

export class HTMLGenerator {
  private markedInstance: Marked;
  private transpiler: Bun.Transpiler;

  constructor() {
    this.markedInstance = this.createMarkedInstance();
    this.transpiler = new Bun.Transpiler({ loader: "ts" });
  }

  async generate(presentation: Presentation): Promise<string> {
    const { slides, meta } = presentation;
    const config = this.extractConfig(meta);

    const assets = await this.loadAssets(config.theme);
    const slidesHtml = this.renderSlides(slides);

    return this.buildHTML(config, assets, slidesHtml);
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
    const [utilitiesCss, printCss, runtimeJs] = await Promise.all([
      Bun.file("src/styles/utilities.css").text(),
      Bun.file("src/styles/print.css").text(),
      this.loadRuntime(),
    ]);

    return {
      themeCss,
      utilitiesCss,
      printCss,
      runtimeJs,
    };
  }

  private async loadRuntime(): Promise<string> {
    const runtimeTs = await Bun.file("src/client/runtime.ts").text();
    return this.transpiler.transformSync(runtimeTs);
  }

  private renderSlides(slides: Presentation["slides"]): string {
    return slides.map((slide) => this.renderSlide(slide)).join("\n");
  }

  private renderSlide(slide: Presentation["slides"][0]): string {
    const contentHtml = this.markedInstance.parser(slide.contentTokens);
    const layoutClass = slide.layout ? `layout-${slide.layout}` : "";

    return `
    <section class="slide ${layoutClass}" id="slide-${slide.id}" data-id="${slide.id}">
      ${contentHtml}
    </section>
    `.trim();
  }

  private buildHTML(
    config: { title: string; theme: string },
    assets: Awaited<ReturnType<typeof this.loadAssets>>,
    slidesHtml: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <style>
    /* Theme: ${config.theme} */
    ${assets.themeCss}

    /* Utilities */
    ${assets.utilitiesCss}

    /* Print Styles */
    ${assets.printCss}
  </style>
</head>
<body>
  <div id="slide-container">
    ${slidesHtml}
  </div>
  <script>
    ${assets.runtimeJs}
  </script>
</body>
</html>`;
  }
}
