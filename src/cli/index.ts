import { parseArguments, showHelp, type CLIOptions } from "./utils";
import { build } from "./builder";

export async function runCLI(args: string[]): Promise<string> {
  try {
    const { inputPath, options } = parseArguments(args);

    if (options.help) {
      console.log(showHelp());
      process.exit(0);
    }

    // Check for version flag
    if (args.includes("--version") || args.includes("-v")) {
      console.log("Slide Bun v1.0.0");
      process.exit(0);
    }

    return build(inputPath, options).then((outPath) => {
      if (options.autoOpen) {
        console.log("Opening...");
        Bun.spawn(["open", outPath]);
      }
      return outPath;
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// Re-export utilities for external use
export { parseArguments, showHelp, type CLIOptions } from "./utils";
export { build } from "./builder";
