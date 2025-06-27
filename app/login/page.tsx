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

export default function LoginPage() {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      localStorage.setItem("nightscoutUrl", url);
      localStorage.setItem("nightscoutToken", token);
      router.push("/");
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nightscoutUrl = urlParams.get('nightscoutUrl');
    const nightscoutToken = urlParams.get('nightscoutToken');
    if (nightscoutUrl && nightscoutToken) {
      localStorage.setItem("nightscoutUrl", nightscoutUrl);
      localStorage.setItem("nightscoutToken", nightscoutToken);
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('LoginPage.title')}</CardTitle>
          <CardDescription>
            {t('LoginPage.description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="url">{t('LoginPage.nightscoutUrl')}</Label>
                <Input
                  id="url"
                  placeholder={t('LoginPage.urlPlaceholder')}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="token">{t('LoginPage.token')}</Label>
                <Input
                  id="token"
                  placeholder={t('LoginPage.tokenPlaceholder')}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              {t('LoginPage.login')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 