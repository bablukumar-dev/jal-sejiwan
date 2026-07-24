import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/?source=pwa',
    name: 'JalSejiwan - Smart Water Management',
    short_name: 'JalSejiwan',
    description: 'Smart Water Delivery, Inventory & Customer Management Platform',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0284c7',
    orientation: 'portrait',
    dir: 'ltr',
    lang: 'en-US',
    categories: ['business', 'utilities', 'productivity'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Delivery Route',
        short_name: 'Deliveries',
        description: 'View active delivery routes',
        url: '/staff/dashboard',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
          },
        ],
      },
      {
        name: 'Inventory Status',
        short_name: 'Inventory',
        description: 'Check water stock levels',
        url: '/inventory',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
          },
        ],
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'JalSejiwan Desktop Dashboard',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '540x960',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'JalSejiwan Mobile Delivery View',
      },
    ],
  };
}
