const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");

async function run() {
  const baseUrl = process.env.AXE_BASE_URL || "http://localhost:5173";
  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/properties`,
    `${baseUrl}/login`,
    `${baseUrl}/register`,
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];

  for (const url of urls) {
    await page.goto(url, { waitUntil: "networkidle" });
    const axe = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();
    results.push({
      url,
      violations: axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          failureSummary: n.failureSummary,
        })),
      })),
      passes: axe.passes
        .filter((p) => p.id === "color-contrast")
        .map((p) => ({
          id: p.id,
          description: p.description,
          nodes: p.nodes.length,
        })),
      incomplete: axe.incomplete
        .filter((i) => i.id === "color-contrast")
        .map((i) => ({
          id: i.id,
          description: i.description,
          nodes: i.nodes.length,
        })),
    });
  }

  await context.close();
  await browser.close();

  const outputDir = path.join("lighthouse-reports");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "axe-contrast-core-pages.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        tool: "axe-core + playwright",
        results,
      },
      null,
      2,
    ),
  );

  console.log("DONE");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
