import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';
import {
  isNaverBlogSearchError,
  searchNaverBlog,
} from './lib/naver-blog/naverBlogSearch.js';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/** npm run dev 에서 /api/naver-blog 를 Vercel 없이 제공 */
export function naverBlogApiPlugin(): Plugin {
  let env: Record<string, string> = {};

  return {
    name: 'naver-blog-api',
    config(_config, { mode }) {
      env = loadEnv(mode, process.cwd(), '');
    },
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const pathname = req.url?.split('?')[0];
        if (pathname !== '/api/naver-blog') {
          next();
          return;
        }

        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }

        const url = new URL(req.url ?? '', 'http://localhost');
        const query = url.searchParams.get('query');
        const display = url.searchParams.get('display');
        const start = url.searchParams.get('start');
        const sort = url.searchParams.get('sort');

        try {
          const result = await searchNaverBlog(
            {
              query: query ?? undefined,
              display: display ?? undefined,
              start: start ?? undefined,
              sort: sort ?? undefined,
            },
            {
              clientId: env.NAVER_CLIENT_ID,
              clientSecret: env.NAVER_CLIENT_SECRET,
            },
          );
          res.setHeader('Cache-Control', 'no-store');
          sendJson(res, 200, result);
        } catch (error) {
          if (isNaverBlogSearchError(error)) {
            if (error.code === 'INVALID_QUERY') {
              sendJson(res, 400, { error: error.message });
              return;
            }
            if (error.code === 'MISSING_CREDENTIALS') {
              sendJson(res, 500, { error: error.message });
              return;
            }
            if (error.code === 'NAVER_API_ERROR') {
              sendJson(res, 502, { error: error.message });
              return;
            }
          }
          console.error('[naver-blog dev]', error);
          sendJson(res, 500, { error: '블로그 검색 중 오류가 발생했습니다.' });
        }
      });
    },
  };
}
