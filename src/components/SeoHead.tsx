import { Helmet } from 'react-helmet-async';
import type { Pool } from '../types/pool';

export const SITE_URL = 'https://ah-poo.kr';
export const SITE_NAME = '어푸!';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/pwa-512x512.png`;
export const DEFAULT_DESCRIPTION =
  '어푸!는 전국 수영장 일일입장·자유수영 정보를 지도에서 찾아볼 수 있는 서비스입니다. 내 주변 공공·민간 수영장, 입장료, 주소, 길찾기를 한눈에 확인하세요.';

export function buildPoolSportsActivityJsonLd(pool: Pool | null | undefined) {
  if (!pool) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: pool.name,
    url: `${SITE_URL}/pool/${pool.id}`,
    ...(pool.roadAddress
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: pool.roadAddress,
            addressCountry: 'KR',
          },
        }
      : {}),
    ...(pool.lat != null && pool.lng != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: pool.lat,
            longitude: pool.lng,
          },
        }
      : {}),
    ...(pool.phone
      ? { telephone: pool.phone.replace(/\s/g, '') }
      : {}),
    ...(pool.official_url ? { sameAs: pool.official_url } : {}),
  };
}

export function buildHomeJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      inLanguage: 'ko-KR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web',
      description: DEFAULT_DESCRIPTION,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
      },
    },
  ];
}

interface SeoHeadProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
  noindex?: boolean;
}

function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  jsonLd,
  noindex = false,
}: SeoHeadProps) {
  const canonicalUrl = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const jsonLdItems = Array.isArray(jsonLd)
    ? jsonLd.filter(Boolean)
    : jsonLd
      ? [jsonLd]
      : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdItems.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}

export default SeoHead;
