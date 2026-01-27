#!/usr/bin/env bun
import { runCLI } from "./cli/index";

// Main execution
const args = Bun.argv.slice(2);

runCLI(args).catch((error) => {
  console.error(error);
  process.exit(1);
});
