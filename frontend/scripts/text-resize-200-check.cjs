const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const base = process.env.AXE_BASE_URL || "http://localhost:5173";
  const paths = ["/", "/properties", "/login", "/register"];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const results = [];

  for (const path of paths) {
    const url = `${base}${path}`;
    await page.goto(url, { waitUntil: "networkidle" });

    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await page.waitForTimeout(300);

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHOverflow:
        document.documentElement.scrollWidth > window.innerWidth + 1,
      interactiveCount: document.querySelectorAll(
        "a,button,input,select,textarea,[tabindex]",
      ).length,
    }));

    results.push({ url, ...metrics });
  }

  await browser.close();

  fs.mkdirSync("frontend/lighthouse-reports", { recursive: true });
  fs.writeFileSync(
    "frontend/lighthouse-reports/text-resize-200-check.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        method: "Playwright html font-size 200% smoke check",
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
