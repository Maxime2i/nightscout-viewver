// app/components/dashboard/SendToMyDiabbyCard.tsx
import React, { useState, useEffect, useRef } from "react";
import { NightscoutEntry } from "@/types/nightscout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useTranslation } from 'react-i18next';

export function SendToMyDiabbyCard({ data }: { data: NightscoutEntry[] }) {
  const { t } = useTranslation('common');
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const cancelRef = useRef(false);

  // Charger depuis localStorage au montage
  useEffect(() => {
    const savedToken = localStorage.getItem("mydiabbyToken") || "";
    setToken(savedToken);
    setIsLoggedIn(!!savedToken);
  }, []);

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (token) {
      localStorage.setItem("mydiabbyToken", token);
      setIsLoggedIn(true);
    }
  }, [token]);

  useEffect(() => {
    cancelRef.current = cancelRequested;
  }, [cancelRequested]);

  async function loginToMyDiabby(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const url = "https://app.mydiabby.com/api/getToken";
      const body = new URLSearchParams({
        username: email,
        password: password,
        platform: "dt",
      });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-locale": "fr",
        },
        credentials: "include", // important pour le cookie PHPSESSID
        body: body.toString(),
      });
      if (!response.ok) {
        throw new Error(t('SendToMyDiabbyCard.login_error'));
      }
      const data = await response.json();
      if (!data.token) {
        throw new Error(t('SendToMyDiabbyCard.token_error'));
      }
      setToken(data.token);
      setStatus(t('SendToMyDiabbyCard.login_success'));
    } catch (e: unknown) {
      setStatus(
        t('SendToMyDiabbyCard.login_error_prefix') +
          ' ' +
          (e instanceof Error ? e.message : String(e))
      );
    }
    setLoading(false);
  }

  async function sendGlycemiaToMyDiabby({
    token,
    glycemia,
    date,
    time,
  }: {
    token: string;
    glycemia: string;
    date: string;
    time: string;
  }) {
    const url = "https://app.mydiabby.com/api/data";
    const body = new URLSearchParams({
      time,
      date,
      add: "true",
      dgnew: "false",
      "glycemia[value]": glycemia,
      "glycemia[typemeal]": "1",
      "glycemia[pp]": "false",
      "glycemia[idsurvey]": "2",
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "X-locale": "fr",
      },
      credentials: "include",
      body: body.toString(),
    });
    if (!response.ok) {
      throw new Error(t('SendToMyDiabbyCard.send_api_error'));
    }
    return response.json();
  }

  const handleSend = async () => {
    setStatus(null);
    setLoading(true);
    setProgress(0);
    setCancelRequested(false);
    cancelRef.current = false;
    try {
      if (!token) {
        setStatus(t('SendToMyDiabbyCard.must_login'));
        setLoading(false);
        return;
      }
      if (!data || data.length === 0) {
        setStatus(t('SendToMyDiabbyCard.no_data'));
        setLoading(false);
        return;
      }
      // Envoyer toutes les glycémies de la plage sélectionnée
      for (let i = 0; i < data.length; i++) {
        if (cancelRef.current) {
          setStatus(t('SendToMyDiabbyCard.cancelled'));
          setLoading(false);
          setCancelRequested(false);
          cancelRef.current = false;
          return;
        }
        const entry = data[i];
        const dateObj = new Date(entry.date);
        const date = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
        const time = dateObj.toTimeString().slice(0, 5); // HH:mm
        const glycemia = (entry.sgv / 100).toFixed(4); // conversion mg/dL -> g/L si besoin
        await sendGlycemiaToMyDiabby({
          token,
          glycemia,
          date,
          time,
        });
        setProgress(Math.round(((i + 1) / data.length) * 100));
      }
      setStatus(t('SendToMyDiabbyCard.success'));
      setCancelRequested(false);
      cancelRef.current = false;
    } catch (e: unknown) {
      setStatus(
        t('SendToMyDiabbyCard.send_error') +
          ' ' +
          (e instanceof Error ? e.message : String(e))
      );
    }
    setLoading(false);
  };

  const handleStop = () => {
    setCancelRequested(true);
    cancelRef.current = true;
  };

  const handleLogout = () => {
    setToken("");
    setIsLoggedIn(false);
    localStorage.removeItem("mydiabbyToken");
    setStatus(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image src="/mydiabby.png" alt="MyDiabby" width={20} height={20} />
          {t('SendToMyDiabbyCard.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('SendToMyDiabbyCard.description')}
        </p>
        {!isLoggedIn ? (
          <form onSubmit={loginToMyDiabby} className="space-y-3">
            <Input
              type="email"
              placeholder={t('SendToMyDiabbyCard.email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              type="password"
              placeholder={t('SendToMyDiabbyCard.password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? t('SendToMyDiabbyCard.connecting') : t('SendToMyDiabbyCard.login')}
            </Button>
          </form>
        ) : (
          <>
            <div className="flex justify-end items-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-blue-700 hover:text-blue-900 px-2 py-1"
                disabled={loading}
              >
                {t('SendToMyDiabbyCard.logout')}
              </Button>
            </div>
            <Button
              onClick={loading ? handleStop : handleSend}
              className={`w-full ${loading ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={cancelRequested}
            >
              {loading ? t('SendToMyDiabbyCard.stop') : t('SendToMyDiabbyCard.send')}
            </Button>
            {loading && (
              <>
                <div className="w-full bg-gray-200 rounded h-4 mb-2 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-4 rounded"
                    style={{ width: `${progress}%`, transition: 'width 0.2s' }}
                  ></div>
                </div>
                <div className="text-sm text-blue-700 mb-2">
                  {t('SendToMyDiabbyCard.sending')}<br />
                  {progress}% ({Math.round((progress/100)*data.length)}/{data.length} {t('SendToMyDiabbyCard.sent_count')})
                </div>
              </>
            )}
          </>
        )}
        {status && <div className="mt-2 text-sm text-center">{status}</div>}
      </CardContent>
      <CardFooter />
    </Card>
  );
}