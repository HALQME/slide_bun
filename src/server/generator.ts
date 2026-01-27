import { HTMLRenderer } from "../template/renderer";
import type { Presentation } from "../types";

export class ServerHTMLGenerator {
  private renderer: HTMLRenderer;

  constructor() {
    this.renderer = new HTMLRenderer();
  }

  async generate(presentation: Presentation): Promise<string> {
    const buildResult = await Bun.build({
      entrypoints: ["src/client/runtime-server.ts"],
      target: "browser",
      minify: true,
    });

    if (!buildResult.success || buildResult.outputs.length === 0) {
      console.error(buildResult.logs);
      throw new Error("Failed to build client runtime");
    }

    const runtimeJs = await buildResult.outputs[0]!.text();
    return this.renderer.generate(presentation, runtimeJs);
  }
}
