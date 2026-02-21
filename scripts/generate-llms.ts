import { generateHonoSpec, generateAuthSpec } from "../src/components/docs/specs";
import { createMarkdownFromOpenApi } from "@scalar/openapi-to-markdown";
import fs from "fs/promises";
import path from "path";

import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

async function generate() {
  console.log("📝 Generating LLM documentation...");

  const [honoSpec, authSpec] = await Promise.all([
    generateHonoSpec(),
    generateAuthSpec(),
  ]);

  let fullMarkdown = await createMarkdownFromOpenApi(honoSpec as any);
  const authMarkdown = await createMarkdownFromOpenApi(authSpec as any);
  fullMarkdown += "\n\n---\n\n" + authMarkdown;

  // Replace special characters with standard ASCII equivalents
  fullMarkdown = fullMarkdown
    .replace(/\u00a0/g, " ")      // Non-breaking space
    .replace(/\u2014/g, " - ")    // Em-dash (with spaces for better readability)
    .replace(/\u2013/g, "-")      // En-dash
    .replace(/[\u201c\u201d]/g, '"') // Smart double quotes
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/\u2026/g, "...");   // Ellipsis


  const summary = `# SadaqahBox

SadaqahBox is a modern application designed to facilitate charitable giving and management.

## Documentation
- [Comprehensive API Documentation](/llms-full.txt) - Detailed API references for all endpoints.
- [Public Documentation](/api/docs) - Interactive Scalar API reference.

## Key Features
- **Charity Management**: Efficiently manage charitable organizations and projects.
- **Donation Tracking**: Real-time tracking and reporting of donations.
- **Secure Authentication**: Robust authentication system using better-auth.
- **Vector Search**: Advanced search capabilities for content discovery.

## API Overview
The API is built with Hono and follows OpenAPI standards. All endpoints are under \`/api\`.
`;

  try {
    await fs.access(PUBLIC_DIR);
  } catch {
    await fs.mkdir(PUBLIC_DIR, { recursive: true });
  }

  await fs.writeFile(path.join(PUBLIC_DIR, "llms.txt"), summary);
  await fs.writeFile(path.join(PUBLIC_DIR, "llms-full.txt"), fullMarkdown);

  console.log("✓ Generated public/llms.txt");
  console.log("✓ Generated public/llms-full.txt");
}

generate().catch((err) => {
  console.error("❌ Error generating LLM documentation:", err);
  process.exit(1);
});
