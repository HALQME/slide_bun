import { resolve, basename, extname, dirname } from "path";
import { existsSync, mkdirSync } from "fs";

export interface CLIOptions {
  outputPath?: string;
  autoOpen: boolean;
  help: boolean;
  minify?: boolean;
}

export function parseArguments(args: string[]): { inputPath: string; options: CLIOptions } {
  const options: CLIOptions = {
    autoOpen: false,
    help: false,
    minify: false,
  };

  let inputPath = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    switch (arg) {
      case "-o":
      case "--output":
        if (i + 1 < args.length) {
          options.outputPath = args[++i];
        } else {
          throw new Error("Error: --output requires a file path");
        }
        break;
      case "--auto-open":
        options.autoOpen = true;
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "--minify":
        options.minify = true;
        break;
      default:
        if (!arg.startsWith("-") && !inputPath) {
          inputPath = arg;
        } else if (arg.startsWith("-")) {
          throw new Error(`Error: Unknown option ${arg}`);
        }
        break;
    }
  }

  if (!inputPath && !options.help) {
    throw new Error("Error: Input file is required");
  }

  return { inputPath, options };
}

export function showHelp(): string {
  return `
slide-bun - Markdown to HTML slide generator

Usage:
  slide-bun <input.md> [options]
  slide-bun serve <input.md> [options]

Commands:
  serve                  Start development server with HMR

Options:
  -o, --output <path>    Set output file path (default: <input>.html)
  --auto-open            Open generated HTML in default browser
  --minify               Minify HTML and CSS for smaller file size
  -v, --version          Show version number
  -h, --help             Show this help message

Serve Options:
  -p, --port <number>    Set server port (default: 3000)

Examples:
  slide-bun presentation.md
  slide-bun serve presentation.md
  slide-bun presentation.md -o slides.html
`;
}

export function getOutputPath(inputPath: string, options: CLIOptions): string {
  if (options.outputPath) {
    // If output path is provided, resolve it relative to current working directory
    return resolve(process.cwd(), options.outputPath);
  }

  // Default: same directory as input file, same name but .html extension
  const ext = extname(inputPath);
  const base = basename(inputPath, ext);
  const inputDir = dirname(resolve(process.cwd(), inputPath));
  return resolve(inputDir, `${base}.html`);
}

export function ensureOutputDirectory(outputPath: string): void {
  const outputDir = dirname(outputPath);
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }
}

export function validateInputFile(inputPath: string): string {
  const absInputPath = resolve(process.cwd(), inputPath);

  if (!existsSync(absInputPath)) {
    throw new Error(`File not found: ${inputPath}`);
  }

  return absInputPath;
}
