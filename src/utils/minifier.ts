export class HTMLMinifier {
  /**
   * Remove HTML comments using Bun's HTMLRewriter
   * This runs regardless of minify setting since comments are not needed in production
   */
  removeComments(html: string): string {
    const rewriter = new HTMLRewriter()
      .on("*", {
        comments(comment) {
          comment.remove();
        },
      })
      .onDocument({
        comments(comment) {
          comment.remove();
        },
      });

    return rewriter.transform(html);
  }

  /**
   * Minify HTML string by removing unnecessary whitespace and comments
   * Note: This is a basic minifier - for advanced minification, consider using html-minifier-terser
   */
  minify(html: string): string {
    return (
      html
        // Remove HTML comments except for conditional comments
        .replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, "")
        // Remove whitespace between tags
        .replace(/>\s{2,}</g, "> <")
        // Remove leading/trailing whitespace
        .trim()
        // Remove newlines
        .replace(/\n+/g, "")
        // Remove tabs
        .replace(/\t/g, "")
    );
  }

  /**
   * Minify CSS by removing comments and unnecessary whitespace
   */
  minifyCSS(css: string): string {
    return (
      css
        // Remove CSS comments
        .replace(/\/\*[\s\S]*?\*\//g, "")
        // Remove whitespace around braces and semicolons
        .replace(/\s*{\s*/g, "{")
        .replace(/;\s*/g, ";")
        .replace(/\s*}\s*/g, "}")
        .replace(/\s*,\s*/g, ",")
        .replace(/\s*:\s*/g, ":")
        // Remove newlines and extra spaces
        .replace(/\n/g, "")
        .replace(/\s+/g, " ")
        .trim()
    );
  }
}
