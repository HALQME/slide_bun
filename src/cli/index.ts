import { parseArguments, showHelp, type CLIOptions } from "./utils";
import { build } from "./builder";
import { startServer } from "../server/index";

export async function runCLI(args: string[]): Promise<string> {
  try {
    if (args.length === 0) {
      console.log(showHelp());
      process.exit(0);
    }

    // Handle "serve" command
    if (args[0] === "serve") {
      const serveArgs = args.slice(1);
      let inputPath = "";
      let port = 3000;

      for (let i = 0; i < serveArgs.length; i++) {
        const arg = serveArgs[i];
        if (!arg) continue;
        if (arg === "-p" || arg === "--port") {
          if (i + 1 < serveArgs.length) {
            const portStr = serveArgs[++i];
            if (portStr) {
              port = parseInt(portStr, 10);
            }
          } else {
            console.error("Error: --port requires a number");
            process.exit(1);
          }
        } else if (arg === "-h" || arg === "--help") {
          console.log(`
slide-bun serve - Start development server

Usage:
  slide-bun serve <input.md> [options]

Options:
  -p, --port <number>    Set server port (default: 3000)
  -h, --help             Show this help message
            `);
          process.exit(0);
        } else if (!arg.startsWith("-")) {
          inputPath = arg;
        }
      }

      if (!inputPath) {
        console.error("Error: Input file is required for serve");
        process.exit(1);
      }

      await startServer(inputPath, port);
      return ""; // Server keeps running
    }

    // Default: Build command
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
