import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isNaverBlogSearchError, searchNaverBlog } from './lib/naverBlogSearch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, display, sort } = req.query ?? {};

  try {
    const result = await searchNaverBlog({ query, display, sort });
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json(result);
  } catch (error) {
    if (isNaverBlogSearchError(error)) {
      if (error.code === 'INVALID_QUERY') {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === 'MISSING_CREDENTIALS') {
        return res.status(500).json({ error: error.message });
      }
      if (error.code === 'NAVER_API_ERROR') {
        return res.status(502).json({ error: error.message });
      }
    }
    console.error('[naver-blog]', error);
    return res.status(500).json({ error: '블로그 검색 중 오류가 발생했습니다.' });
  }
}
