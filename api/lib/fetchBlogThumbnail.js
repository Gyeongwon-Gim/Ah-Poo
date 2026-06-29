const OG_IMAGE_RE =
  /property=["']og:image["'][^>]*content=["']([^"']+)["']/i;
const OG_IMAGE_RE_ALT =
  /content=["']([^"']+)["'][^>]*property=["']og:image["']/i;

/** blog.naver.com/{id}/{logNo} → m.blog.naver.com/{id}/{logNo} */
export function toMobileBlogUrl(link) {
  try {
    const url = new URL(link);
    if (url.hostname === 'm.blog.naver.com') return link;

    if (url.hostname === 'blog.naver.com') {
      const [blogId, logNo] = url.pathname.split('/').filter(Boolean);
      if (blogId && logNo && /^\d+$/.test(logNo)) {
        return `https://m.blog.naver.com/${blogId}/${logNo}`;
      }
    }
  } catch {
    /* invalid URL */
  }
  return link;
}

export async function fetchBlogThumbnail(link, { timeoutMs = 1200 } = {}) {
  const mobileUrl = toMobileBlogUrl(link);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(mobileUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        Accept: 'text/html',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(OG_IMAGE_RE) ?? html.match(OG_IMAGE_RE_ALT);
    return match?.[1] ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function enrichBlogThumbnails(items, { limit = 5 } = {}) {
  const targets = items.slice(0, limit);
  const thumbnails = await Promise.all(
    targets.map((item) => fetchBlogThumbnail(item.link)),
  );

  return items.map((item, index) => {
    if (index >= limit) return item;
    const thumbnailUrl = thumbnails[index];
    return thumbnailUrl ? { ...item, thumbnailUrl } : item;
  });
}
