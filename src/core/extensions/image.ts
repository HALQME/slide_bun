import type { TokenizerAndRendererExtension, Tokens } from "marked";
import { attrsToClass } from "./classUtils";

export interface StyledImageToken extends Tokens.Generic {
  type: "styledImage";
  text: string; // alt text
  href: string; // url
  attrs: string;
}

export const styledImageExtension: TokenizerAndRendererExtension = {
  name: "styledImage",
  level: "inline",
  start(src: string) {
    return src.match(/!\[/)?.index;
  },
  tokenizer(src: string) {
    // Example: ![alt](url){.class}
    const rule = /^!\[([^\]]*)\]\(([^)]+)\)\{([.#\w\s-]+)\}/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: "styledImage",
        raw: match[0],
        text: match[1]!,
        href: match[2]!.trim(),
        attrs: match[3]!.trim(),
      };
    }
  },
  renderer(token) {
    const styledToken = token as StyledImageToken;
    // Normalize classes: remove leading '.' characters, collapse whitespace, and trim
    const className = styledToken.attrs.replace(/\./g, "").split(/\s+/).filter(Boolean).join(" ");

    // Place class attribute first to make tests that search for `<img class="...">` deterministic
    return `<img class="${className}" src="${styledToken.href}" alt="${styledToken.text}">`;
  },
};
