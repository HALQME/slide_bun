import type { TokenizerAndRendererExtension, Tokens } from "marked";

export interface ContainerToken extends Tokens.Generic {
  type: "container";
  kind: string;
  tokens: Tokens.Generic[];
}

export const containerExtension: TokenizerAndRendererExtension = {
  name: "container",
  level: "block",
  start(src: string) {
    return src.match(/^:::/)?.index;
  },
  tokenizer(src: string) {
    // Example: ::: speaker \n ... \n ::
    // Supports variable length fences (::: vs :::: etc) for nesting
    // Allows whitespace before closing fence
    const rule = /^(:{3,}) *(\w+)\n([\s\S]*?)\n *(\1)(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const token: ContainerToken = {
        type: "container",
        raw: match[0],
        kind: match[2]!, // match[2] is the name now
        tokens: [],
      };

      this.lexer.blockTokens(match[3]!.trim(), token.tokens);

      return token;
    }
  },
  renderer(token) {
    const containerToken = token as ContainerToken;
    return `<div class="slide-container ${containerToken.kind}">${this.parser.parse(containerToken.tokens)}</div>`;
  },
};
