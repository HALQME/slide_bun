#!/usr/bin/env bun
import { parseArguments, showHelp } from "./cli/utils";
import { build } from "./cli/builder";

// Main execution
const args = Bun.argv.slice(2);

try {
  const { inputPath, options } = parseArguments(args);

  if (options.help) {
    console.log(showHelp());
    process.exit(0);
  }

  build(inputPath, options)
    .then((outPath) => {
      if (options.autoOpen) {
        console.log("Opening...");
        Bun.spawn(["open", outPath]);
      }
    })
    .catch((error) => {
      console.error("Build failed:", error);
      process.exit(1);
    });
} catch (error) {
  console.error(error);
  process.exit(1);
}
