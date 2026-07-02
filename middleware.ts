import { rewrite } from '@vercel/edge';

const CRAWLER_UA =
  /bot|crawl|slurp|spider|mediapartners|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Kakaotalk|kakaostory|Daum|naver|yeti|preview|SkypeUriPreview|Slackbot|Discordbot/i;

export const config = {
  matcher: '/',
};

export default function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname !== '/') {
    return;
  }

  const poolId = url.searchParams.get('pool');
  if (!poolId) {
    return;
  }

  const ua = request.headers.get('user-agent') ?? '';
  if (!CRAWLER_UA.test(ua)) {
    return;
  }

  return rewrite(new URL(`/pool/${encodeURIComponent(poolId)}`, request.url));
}
