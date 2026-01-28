import { Marked } from "marked";
import matter from "gray-matter";
import {
  styledHeadingExtension,
  styledSpanExtension,
  containerExtension,
  styledImageExtension,
  styledParagraphExtension,
} from "./extensions";
import { splitTokensToSlides } from "./splitter";
import type { Presentation, PresentationMeta } from "../types";

export class MarkdownParser {
  private markedInstance: Marked;

  constructor() {
    this.markedInstance = new Marked();
    this.markedInstance.use({
      extensions: [
        styledHeadingExtension,
        styledSpanExtension,
        containerExtension,
        styledImageExtension,
        styledParagraphExtension,
      ],
    });
  }

  parse(rawMarkdown: string): Presentation {
    // 1. Parse Frontmatter
    const { content, data } = matter(rawMarkdown);

    // 2. Tokenize with Marked
    const tokens = this.markedInstance.lexer(content);

    // 3. Split into slides
    const slides = splitTokensToSlides(tokens);

    // 4. Construct Presentation object
    const meta: PresentationMeta = {
      title: data.title,
      theme: data.theme || "default",
      mode: data.mode, // 'light' | 'dark' | 'auto'
      aspectRatio: data.aspectRatio,
      fontSize: data.fontSize, // 'XS' | 'S' | 'M' | 'L' | 'XL'
      ...data, // Include other frontmatter data
    };

    return {
      meta,
      slides,
    };
  }
}

// Singleton or simple export? Class allows caching instance if needed.
// Let's export a simple function for ease of use, using a singleton instance if needed,
// or just creating a new one (cheap enough).
export function parseMarkdown(src: string): Presentation {
  const parser = new MarkdownParser();
  return parser.parse(src);
}
