import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  let baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://jalsejiwan.in').replace(/\/$/, '');
  if (baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'https://');
  }

  const routes = [
    { url: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { url: '/login', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/signup', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/privacy', changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: '/terms', changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
