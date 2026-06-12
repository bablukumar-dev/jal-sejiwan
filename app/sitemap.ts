import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Use the system injected APP_URL first, fallback to standard localhost or production placeholder
  const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://jalsejiwan.in').replace(/\/$/, '');

  const staticRoutes = [
    { url: '', changeFrequency: 'daily', priority: 1.0 },
    { url: '/login', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
    { url: '/terms', changeFrequency: 'monthly', priority: 0.5 },
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency as 'daily' | 'monthly' | 'weekly',
    priority: route.priority,
  }));
}
