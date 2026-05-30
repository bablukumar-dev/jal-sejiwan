import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Use the system injected APP_URL first, fallback to standard localhost or production placeholder
  const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://jalsejiwan.in').replace(/\/$/, '');

  const staticRoutes = [
    { url: '', changeFrequency: 'daily', priority: 1.0 },
    { url: '/login', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/settings', changeFrequency: 'monthly', priority: 0.8 },
    
    // Owner Routes
    { url: '/owner/dashboard', changeFrequency: 'daily', priority: 0.9 },
    { url: '/owner/customers', changeFrequency: 'daily', priority: 0.8 },
    { url: '/owner/customers/add', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/owner/customers/edit', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/owner/deliveries', changeFrequency: 'daily', priority: 0.8 },
    { url: '/owner/payments', changeFrequency: 'daily', priority: 0.8 },
    { url: '/owner/reports', changeFrequency: 'daily', priority: 0.8 },
    { url: '/owner/routes', changeFrequency: 'weekly', priority: 0.8 },
    { url: '/owner/staff', changeFrequency: 'weekly', priority: 0.7 },
    { url: '/owner/staff/add', changeFrequency: 'monthly', priority: 0.6 },
    { url: '/owner/dashboard/prices', changeFrequency: 'monthly', priority: 0.6 },
    
    // Inventory Management Routes (Manager/Owner)
    { url: '/inventory/dashboard', changeFrequency: 'daily', priority: 0.8 },
    { url: '/inventory/dispatch', changeFrequency: 'daily', priority: 0.8 },
    { url: '/inventory/history', changeFrequency: 'daily', priority: 0.8 },
    { url: '/inventory/reconciliation', changeFrequency: 'daily', priority: 0.8 },
    
    // Staff Routes (Delivery Partners)
    { url: '/staff/dashboard', changeFrequency: 'daily', priority: 0.8 },
    { url: '/staff/customers', changeFrequency: 'daily', priority: 0.8 },
    { url: '/staff/route', changeFrequency: 'daily', priority: 0.8 },
    { url: '/staff/service', changeFrequency: 'daily', priority: 0.7 },
    { url: '/staff/reports', changeFrequency: 'daily', priority: 0.7 },
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency as 'daily' | 'monthly' | 'weekly',
    priority: route.priority,
  }));
}
