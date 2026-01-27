import { parseMarkdown } from "../core/parser";
import { HTMLGenerator } from "../template/generator";
import type { CLIOptions } from "./utils";
import { getOutputPath, ensureOutputDirectory, validateInputFile } from "./utils";

export async function build(inputPath: string, options: CLIOptions): Promise<string> {
  const absInputPath = validateInputFile(inputPath);
  const outputPath = getOutputPath(inputPath, options);

  // Ensure output directory exists
  ensureOutputDirectory(outputPath);

  console.log(`Building ${inputPath} -> ${outputPath}...`);

  try {
    const markdown = await Bun.file(absInputPath).text();

    // 1. Parse
    const presentation = parseMarkdown(markdown);

    // 2. Generate HTML
    const generator = new HTMLGenerator();
    const html = await generator.generate(presentation);

    // 3. Write Output
    await Bun.write(outputPath, html);
    console.log(`Generated: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error("Build failed:", error);
    throw error;
  }
}
