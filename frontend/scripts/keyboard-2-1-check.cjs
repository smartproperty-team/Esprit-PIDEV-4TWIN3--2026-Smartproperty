const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const base = process.env.AXE_BASE_URL || "http://localhost:5173";
  const routes = ["/", "/properties", "/login", "/register"];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const results = [];

  for (const route of routes) {
    const url = `${base}${route}`;
    await page.goto(url, { waitUntil: "networkidle" });

    const focusableCount = await page.evaluate(
      () =>
        document.querySelectorAll(
          "a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ).length,
    );

    await page.keyboard.press("Tab");
    const sequence = [];

    for (let i = 0; i < 20; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return "none";
        const id = el.id ? `#${el.id}` : "";
        const cls =
          typeof el.className === "string" && el.className.trim().length > 0
            ? `.${el.className.trim().split(/\\s+/).slice(0, 2).join(".")}`
            : "";
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      });
      sequence.push(focused);
      await page.keyboard.press("Tab");
    }

    const uniqueFocusTargets = new Set(sequence).size;
    const stuck = uniqueFocusTargets < 3;

    results.push({
      url,
      focusableCount,
      uniqueFocusTargets,
      probableTrap: stuck,
      firstTargets: sequence.slice(0, 8),
    });
  }

  await browser.close();

  fs.mkdirSync("frontend/lighthouse-reports", { recursive: true });
  fs.writeFileSync(
    "frontend/lighthouse-reports/keyboard-2-1-check.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        method: "Playwright tab sequence smoke test",
        results,
      },
      null,
      2,
    ),
  );

  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
