import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  let baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://jalsejiwan.in').replace(/\/$/, '');
  if (baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/owner/', '/staff/', '/inventory/', '/settings/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
