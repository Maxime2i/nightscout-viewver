"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import '../../../i18n';

interface LocalizedLoginClientProps {
  locale: string;
}

export function LocalizedLoginClient({ locale }: LocalizedLoginClientProps) {
  const { t, i18n } = useTranslation('common');
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const router = useRouter();

  // Initialiser la langue immédiatement
  if (locale && i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      localStorage.setItem("nightscoutUrl", url);
      localStorage.setItem("nightscoutToken", token);
      router.push(`/${locale}`);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nightscoutUrl = urlParams.get('nightscoutUrl');
    const nightscoutToken = urlParams.get('nightscoutToken');
    if (nightscoutUrl && nightscoutToken) {
      localStorage.setItem("nightscoutUrl", nightscoutUrl);
      localStorage.setItem("nightscoutToken", nightscoutToken);
      router.push(`/${locale}`);
    }
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('Login.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('Login.description')}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('Login.connectToNightscout')}</CardTitle>
            <CardDescription>
              {t('Login.enterYourNightscoutUrl')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="url">{t('Login.nightscoutUrl')}</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-nightscout.herokuapp.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="token">{t('Login.token')} ({t('Login.optional')})</Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t('Login.tokenPlaceholder')}
                />
              </div>
              <Button type="submit" className="w-full">
                {t('Login.connect')}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t('Login.tokenInfo')}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 