import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const routesPath = path.join(root, 'scripts/prerender-routes.json');
const PORT = 4173;
const RENDER_TIMEOUT_MS = 8000;

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.xml')) return 'application/xml';
  return 'application/octet-stream';
}

function createSpaServer() {
  return createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
    let filePath = path.join(distDir, urlPath);

    if (urlPath.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    } else if (!path.extname(urlPath) && existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!path.extname(urlPath)) {
      const asFile = filePath;
      if (existsSync(asFile) && statSync(asFile).isFile()) {
        filePath = asFile;
      } else {
        filePath = path.join(distDir, 'index.html');
      }
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(readFileSync(filePath));
  });
}

function routeOutputPath(route) {
  if (route === '/') return path.join(distDir, 'index.html');
  const normalized = route.replace(/^\//, '').replace(/\/$/, '');
  return path.join(distDir, normalized, 'index.html');
}

async function waitForRender(page, route) {
  if (route.startsWith('/pool/')) {
    await page.waitForFunction(
      () => {
        const heading = document.querySelector('#seo-crawler-content h1');
        if (heading?.textContent?.trim()) return true;
        const err = document.querySelector('.pool-detail__status--error');
        return Boolean(err?.textContent?.trim());
      },
      { timeout: 20000 },
    );
    return;
  }

  await page.evaluate(
    () =>
      new Promise((resolve) => {
        if (document.querySelector('#crawler-intro')) {
          resolve(undefined);
          return;
        }
        document.addEventListener('render-event', () => resolve(undefined), {
          once: true,
        });
        setTimeout(resolve, RENDER_TIMEOUT_MS);
      }),
  );
}

async function main() {
  if (process.env.SKIP_PRERENDER === 'true') {
    console.log('[prerender] skipped (SKIP_PRERENDER=true)');
    return;
  }

  if (!existsSync(distDir)) {
    console.error('[prerender] dist/ not found — run vite build first');
    process.exit(1);
  }

  const allRoutes = existsSync(routesPath)
    ? JSON.parse(readFileSync(routesPath, 'utf8'))
    : ['/'];

  let routes = allRoutes;
  const maxRoutes = Number(process.env.PRERENDER_MAX_ROUTES ?? 0);

  if (maxRoutes > 0) {
    routes = allRoutes.slice(0, maxRoutes);
    console.warn(
      `[prerender] limiting to ${routes.length}/${allRoutes.length} routes (PRERENDER_MAX_ROUTES)`,
    );
  } else if (
    process.env.PRERENDER_ALL !== 'true' &&
    allRoutes.length > 50
  ) {
    routes = ['/'];
    console.warn(
      `[prerender] ${allRoutes.length} routes — prerendering "/" only (set PRERENDER_ALL=true for all)`,
    );
  }

  const server = createSpaServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  let ok = 0;
  let failed = 0;

  for (const route of routes) {
    const page = await context.newPage();
    try {
      await page.goto(`http://127.0.0.1:${PORT}${route}`, {
        waitUntil: 'load',
        timeout: 60000,
      });
      await waitForRender(page, route);

      const html = await page.content();
      const outPath = routeOutputPath(route);
      mkdirSync(path.dirname(outPath), { recursive: true });
      writeFileSync(outPath, html, 'utf8');
      ok += 1;
      if (ok % 50 === 0 || route === '/' || routes.length <= 10) {
        console.log(`[prerender] ${ok}/${routes.length} ${route}`);
      }
    } catch (err) {
      failed += 1;
      console.warn(`[prerender] failed ${route}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`[prerender] done — success: ${ok}, failed: ${failed}`);

  if (ok === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[prerender] fatal:', err);
  process.exit(1);
});
