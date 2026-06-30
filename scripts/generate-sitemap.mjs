import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SITE_URL = 'https://ah-poo.kr';

function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(root, '.env');

  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    /* .env 없으면 process.env만 사용 */
  }

  return env;
}

async function fetchPoolIds(supabaseUrl, supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('pools')
    .select('id')
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

function buildSitemapXml(urls) {
  const body = urls
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  let poolIds = [];

  if (supabaseUrl && supabaseKey) {
    try {
      poolIds = await fetchPoolIds(supabaseUrl, supabaseKey);
      console.log(`[sitemap] fetched ${poolIds.length} pool ids from Supabase`);
    } catch (err) {
      console.warn(
        `[sitemap] Supabase fetch failed (${err.message}); homepage only`,
      );
    }
  } else {
    console.warn('[sitemap] Supabase env not set; homepage only');
  }

  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    ...poolIds.map((id) => ({
      loc: `${SITE_URL}/pool/${id}`,
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ];

  writeFileSync(
    path.join(root, 'public/sitemap.xml'),
    buildSitemapXml(urls),
    'utf8',
  );

  const routes = ['/', ...poolIds.map((id) => `/pool/${id}`)];
  writeFileSync(
    path.join(root, 'scripts/prerender-routes.json'),
    `${JSON.stringify(routes, null, 2)}\n`,
    'utf8',
  );

  console.log(`[sitemap] wrote public/sitemap.xml (${urls.length} URLs)`);
  console.log(
    `[sitemap] wrote scripts/prerender-routes.json (${routes.length} routes)`,
  );
}

main().catch((err) => {
  console.error('[sitemap] failed:', err);
  process.exit(1);
});
