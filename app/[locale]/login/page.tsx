import { LocalizedLoginClient } from './LocalizedLoginClient';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LocalizedLoginPage({ params }: PageProps) {
  const { locale } = await params;
  
  return <LocalizedLoginClient locale={locale} />;
} 