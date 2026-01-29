import { describe, it, expect } from "bun:test";
import { MarkdownParser } from "../../src/core/parser";

describe("MarkdownParser Image Handling", () => {
  const parser = new MarkdownParser();

  it("should unwrap simple images from paragraphs", () => {
    // Normal markdown image
    const md = "![alt](img.png)";
    // We expect NO <p> tags wrapping the image
    const result = parser.parse(md);
    // parser.parse returns Presentation object. We need to check the html content of the slide.
    // Actually parser.parse returns slides with tokens. 
    // We need to render it to check HTML. 
    // Wait, the unwrapping logic usually happens at RENDER time if we use a custom renderer.
    // If we modify the parser to return different tokens, we can check tokens.
    
    // BUT, the goal is "img not in p". 
    // If I use a custom renderer in the parser (Marked), the tokens themselves are still Paragraphs, 
    // but the renderer outputs them without <p>.
    // So I need to use the renderer to check.
  });
});
