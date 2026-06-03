import LandingPage from '@/components/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Water Delivery Management Software India | JalSejiwan',
  description: 'JalSejiwan is a Water Delivery Management Software India built for 20 litre water jar businesses. Manage billing, inventory, delivery tracking and WhatsApp reminders in one platform.',
};

export default function Home() {
  return <LandingPage />;
}
