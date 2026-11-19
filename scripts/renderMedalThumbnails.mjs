// Run against a local Vite server. Point PULSETRACK_PLAYWRIGHT_MODULE to an
// existing Playwright installation to avoid adding browser tooling to the app.
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
const { chromium } = await import(process.env.PULSETRACK_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  await page.goto(process.argv[2] || 'http://127.0.0.1:5173/');
  const images = await page.evaluate(async () => {
    const { MEDAL_RENDER_VARIANTS } = await import('/src/lib/medals/catalog.js');
    const { createPosterRenderer } = await import('/src/components/medals/three/models.js');
    const renderer = createPosterRenderer();
    try { return MEDAL_RENDER_VARIANTS.map(definition => ({ id: `${definition.id}-${definition.metal}`, data: renderer.render(definition).split(',')[1] })); }
    finally { renderer.dispose(); }
  });
  const directory = new URL('../public/medals/', import.meta.url);await mkdir(directory,{ recursive: true });
  for (const image of images) await writeFile(new URL(`${image.id}.webp`,directory),Buffer.from(image.data,'base64'));
  const keep = new Set(images.map(image => `${image.id}.webp`));
  for (const file of await readdir(directory)) if (file.endsWith('.webp') && !keep.has(file)) await unlink(new URL(file, directory));
  console.log(`Exported ${images.length} medal thumbnails.`);
} finally { await browser.close(); }
