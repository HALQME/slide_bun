import { watch } from "fs";
import * as path from "path";
import { parseMarkdown } from "../core/parser";
import { ServerHTMLGenerator } from "./generator";

export async function startServer(inputPath: string, port: number) {
  const absoluteInputPath = path.resolve(inputPath);
  const inputDir = path.dirname(absoluteInputPath);
  const generator = new ServerHTMLGenerator();

  // State
  let currentHTML = "";
  let presentation = await loadPresentation(absoluteInputPath);
  currentHTML = await generator.generate(presentation);

  // Clients for HMR
  const clients = new Set<ReadableStreamDefaultController>();

  console.log(`Starting server for ${inputPath} on http://localhost:${port}`);

  // Watch for changes
  const watcher = watch(absoluteInputPath, async (event, filename) => {
    console.log(`File changed: ${filename}. Rebuilding...`);
    try {
      presentation = await loadPresentation(absoluteInputPath);
      currentHTML = await generator.generate(presentation);

      // Notify clients
      for (const controller of clients) {
        controller.enqueue("data: reload\n\n");
      }
    } catch (e) {
      console.error("Error rebuilding:", e);
    }
  });

  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // SSE Endpoint
      if (url.pathname === "/_reload") {
        return new Response(
          new ReadableStream({
            start(controller) {
              clients.add(controller);
            },
            cancel(controller) {
              clients.delete(controller);
            },
          }),
          {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          },
        );
      }

      // Serve HTML
      if (url.pathname === "/" || url.pathname === "/presenter") {
        return new Response(currentHTML, {
          headers: { "Content-Type": "text/html" },
        });
      }

      // Static assets (images, etc) relative to markdown file
      // SECURITY: Prevent directory traversal
      const safePath = path
        .normalize(decodeURIComponent(url.pathname))
        .replace(/^(\.\.[/\\])+/, "");
      const filePath = path.join(inputDir, safePath);

      if (!filePath.startsWith(inputDir)) {
        return new Response("Forbidden", { status: 403 });
      }

      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  // Handle cleanup
  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
}

async function loadPresentation(filePath: string) {
  const markdown = await Bun.file(filePath).text();
  return parseMarkdown(markdown);
}
