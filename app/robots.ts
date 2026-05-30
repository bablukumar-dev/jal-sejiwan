import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Retrieve application base URL
  const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://jalsejiwan.in').replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
