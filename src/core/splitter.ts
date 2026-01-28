import type { Token } from "marked";
import type { Slide } from "../types";
import type { ContainerToken } from "./extensions/container";

/**
 * トークンの内容からテキストを抽出し、文字数を計算
 * （コンテンツ量の推定に使用）
 */
function calculateContentLength(tokens: Token[]): number {
  let length = 0;

  for (const token of tokens) {
    if (token.type === "text") {
      length += token.text?.length ?? 0;
    } else if (token.type === "paragraph") {
      if ("tokens" in token && Array.isArray(token.tokens)) {
        length += calculateContentLength(token.tokens);
      } else if ("text" in token) {
        length += token.text?.length ?? 0;
      }
    } else if (token.type === "heading") {
      if ("tokens" in token && Array.isArray(token.tokens)) {
        length += calculateContentLength(token.tokens);
      } else if ("text" in token) {
        length += token.text?.length ?? 0;
      }
    } else if (token.type === "list") {
      if ("items" in token && Array.isArray(token.items)) {
        for (const item of token.items) {
          if ("tokens" in item && Array.isArray(item.tokens)) {
            length += calculateContentLength(item.tokens);
          }
        }
      }
    } else if (token.type === "blockquote") {
      if ("tokens" in token && Array.isArray(token.tokens)) {
        length += calculateContentLength(token.tokens);
      }
    } else if (token.type === "code") {
      length += token.text?.length ?? 0;
    } else if ("tokens" in token && Array.isArray(token.tokens)) {
      length += calculateContentLength(token.tokens);
    }
  }

  return length;
}

export function splitTokensToSlides(tokens: Token[]): Slide[] {
  const slides: Slide[] = [];
  let currentSlideTokens: Token[] = [];
  let currentNoteTokens: Token[] = [];
  let slideIdCounter = 1;

  const pushSlide = () => {
    // Only push if there's content or it's not the very first empty slide (though empty slides are valid)
    // Actually, usually we push whatever we have when we hit HR or end.
    // If it's completely empty and it's the start, maybe we skip?
    // But a user might start with HR.
    // Let's stick to simple logic: Accumulate, push on HR.

    // However, if the file starts with HR, we might get an empty first slide.
    // Let's check logic:
    // tokens: [HR, content, HR, content] -> Slide 1 (empty), Slide 2 (content), Slide 3 (content)??
    // Usual markdown slide behaviour: content... --- content...
    // If it starts with content, that's slide 1.
    // If we hit HR, we finish current slide and start new one.

    if (currentSlideTokens.length > 0 || currentNoteTokens.length > 0) {
      slides.push({
        id: slideIdCounter++,
        contentTokens: [...currentSlideTokens],
        noteTokens: [...currentNoteTokens],
        contentLength: calculateContentLength(currentSlideTokens),
      });
    }
    currentSlideTokens = [];
    currentNoteTokens = [];
  };

  for (const token of tokens) {
    if (token.type === "hr") {
      pushSlide();
    } else if (token.type === "container" && (token as ContainerToken).kind === "speaker") {
      // It's a speaker note
      // The content of the speaker note is inside token.tokens
      // We can either push the container token itself, or its children.
      // The spec says "Extract... as 'note'".
      // types says noteTokens: Token[].
      // Let's store the children of the container to be cleaner,
      // or the container itself if we want to preserve that structure.
      // Spec says: "noteTokens: Token[] // MarkedのToken配列（ノート用）"
      // If I unwrap it, it's just a list of tokens. That seems useful.
      const container = token as ContainerToken;
      currentNoteTokens.push(...container.tokens);
    } else {
      currentSlideTokens.push(token);
    }
  }

  // Push the last slide if any remains
  if (currentSlideTokens.length > 0 || currentNoteTokens.length > 0) {
    pushSlide();
  }

  // If no slides found (empty file), maybe return empty array?
  // Current logic does that.

  return slides;
}
