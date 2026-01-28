import { parseMarkdown } from "../core/parser";
import { HTMLRenderer } from "../template/renderer";
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

    // 2. Prepare Runtime (Static)
    const buildResult = await Bun.build({
      entrypoints: ["src/client/runtime-static.ts"],
      target: "browser",
      minify: true,
    });

    if (!buildResult.success || buildResult.outputs.length === 0) {
      console.error(buildResult.logs);
      throw new Error("Failed to build client runtime");
    }

    const runtimeJs = await buildResult.outputs[0]!.text();

    // 3. Generate HTML
    const renderer = new HTMLRenderer({ enableMinify: options.minify });
    const html = await renderer.generate(presentation, runtimeJs);

    // 4. Write Output
    await Bun.write(outputPath, html);
    console.log(`Generated: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error("Build failed:", error);
    throw error;
  }
}
