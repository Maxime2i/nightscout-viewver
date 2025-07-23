import { LocalizedHomeClient } from './LocalizedHomeClient';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LocalizedHome({ params }: PageProps) {
  const { locale } = await params;
  
  return <LocalizedHomeClient locale={locale} />;
} 