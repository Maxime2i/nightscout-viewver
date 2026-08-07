// app/components/dashboard/SendToMyDiabbyCard.tsx
import React, { useState, useEffect, useRef } from "react";
import { NightscoutEntry, NightscoutTreatment } from "@/types/nightscout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Ajout du type pour les entrées MyDiabby
interface MyDiabbyGlycemiaEntry {
  date: string;
  time: string;
  glycemia?: {
    value?: string;
    typemeal?: string;
    pp?: string;
    idsurvey?: string;
  };
  insulin?: {
    bolus?: string;
    bolus_corr?: string;
    basal?: string;
  };
  meal?: {
    carb?: string;
  };
  // Ajoutez d'autres champs si besoin
}

export function SendToMyDiabbyCard({ data, treatments, isDemo = false }: { data: NightscoutEntry[], treatments: NightscoutTreatment[], isDemo?: boolean }) {
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

  // État pour la modale d'envoi groupé
  const [openSendModal, setOpenSendModal] = useState(false);
  const [sendGlycemia, setSendGlycemia] = useState(true);
  const [sendBolus, setSendBolus] = useState(true);
  const [sendBasal, setSendBasal] = useState(false);

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

  // Envoi groupé de plusieurs glycémies en UN seul appel.
  // Format PHP validé : glycemia[0][value], glycemia[0][date], ...
  // Renvoie false si le serveur a rejeté le lot (fallback individuel requis).
  async function sendGlycemiaBatchToMyDiabby({
    token,
    entries,
  }: {
    token: string;
    entries: { date: string; time: string; glycemia: string }[];
  }) {
    const url = "https://app.mydiabby.com/api/data";
    const params: [string, string][] = [
      ["add", "true"],
      ["dgnew", "false"],
    ];
    entries.forEach((e, i) => {
      params.push([`glycemia[${i}][value]`, e.glycemia]);
      params.push([`glycemia[${i}][typemeal]`, "1"]);
      params.push([`glycemia[${i}][pp]`, "false"]);
      params.push([`glycemia[${i}][idsurvey]`, "2"]);
      params.push([`glycemia[${i}][date]`, e.date]);
      params.push([`glycemia[${i}][time]`, e.time]);
    });
    const body = new URLSearchParams(params);
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
    if (!response.ok) return false;
    const data = await response.json();
    // Un lot rejeté renvoie { success: false } — on prévient l'appelant.
    if (data && data.success === false) return false;
    return true;
  }

  // Fonction d'envoi d'un bolus (repas ou correction)
  async function sendBolusToMyDiabby({
    token,
    bolus,
    date,
    time,
    isCorrection,
    carbs
  }: {
    token: string;
    bolus: string;
    date: string;
    time: string;
    isCorrection?: boolean;
    carbs?: string;
  }) {

    console.log(carbs);
    const url = "https://app.mydiabby.com/api/data";
    const body = new URLSearchParams({
      time,
      date,
      add: "true",
      dgnew: "false",
      ...(isCorrection
        ? { "insulin[bolus_corr]": bolus }
        : { "insulin[bolus]": bolus }),
      ...(carbs ? { "meal[carb]": carbs } : {})
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
      throw new Error("Erreur lors de l'envoi du bolus à MyDiabby");
    }
    return response.json();
  }

  // Fonction pour récupérer les bolus déjà présents sur MyDiabby
  async function fetchMyDiabbyBolus(token: string) {
    const url = "https://app.mydiabby.com/api/data";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        Authorization: `Bearer ${token}`,
        "X-locale": "fr",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des bolus MyDiabby");
    }
    const data = await response.json();
    // On ne garde que les bolus
    return (data.data?.glycemia || []).filter(
      (g: MyDiabbyGlycemiaEntry) => g.insulin && g.insulin.bolus
    );
  }

  // Fonction de comparaison (bolus local <-> bolus MyDiabby)
  function isSameBolus(local: NightscoutTreatment, remote: MyDiabbyGlycemiaEntry) {
    const localDate = new Date(local.date);
    const localDateStr = localDate.toISOString().slice(0, 10);
    const localTimeStr = localDate.toTimeString().slice(0, 5);
    const localDose = Number(local.insulin);
    const remoteDose = Number(remote.insulin?.bolus);
    return (
      remote.date === localDateStr &&
      remote.time === localTimeStr &&
      Math.abs(remoteDose - localDose) < 0.001
    );
  }

  // Fonction pour récupérer les basals déjà présents sur MyDiabby
  async function fetchMyDiabbyBasal(token: string) {
    const url = "https://app.mydiabby.com/api/data";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        Authorization: `Bearer ${token}`,
        "X-locale": "fr",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des basals MyDiabby");
    }
    const data = await response.json();
    // On ne garde que les basals
    return (data.data?.glycemia || []).filter(
      (g: MyDiabbyGlycemiaEntry) => g.insulin && g.insulin.basal
    );
  }

  // Fonction de comparaison (basal local <-> basal MyDiabby)
  function isSameBasal(local: NightscoutTreatment, remote: MyDiabbyGlycemiaEntry) {
    const localDate = new Date(local.date);
    const localDateStr = localDate.toISOString().slice(0, 10);
    const localTimeStr = localDate.toTimeString().slice(0, 5);
    const localDose = Number(local.rate);
    const remoteDose = Number(remote.insulin?.basal);
    return (
      remote.date === localDateStr &&
      remote.time === localTimeStr &&
      Math.abs(remoteDose - localDose) < 0.001
    );
  }

  // Fonction pour récupérer les glycémies déjà présentes sur MyDiabby
  async function fetchMyDiabbyGlycemia(token: string) {
    const url = "https://app.mydiabby.com/api/data";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        Authorization: `Bearer ${token}`,
        "X-locale": "fr",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des glycémies MyDiabby");
    }
    const data = await response.json();
    // On ne garde que les glycémies
    return (data.data?.glycemia || []).filter(
      (g: MyDiabbyGlycemiaEntry) => g.glycemia && g.glycemia.value
    );
  }

  // Fonction de comparaison (glycémie locale <-> glycémie MyDiabby)
  function isSameGlycemia(local: NightscoutEntry, remote: MyDiabbyGlycemiaEntry) {
    const localDate = new Date(local.date);
    const localDateStr = localDate.toISOString().slice(0, 10);
    const localTimeStr = localDate.toTimeString().slice(0, 5);
    const localValue = (local.sgv / 100).toFixed(4);
    const remoteValue = remote.glycemia?.value ? Number(remote.glycemia.value) : NaN;
    return (
      remote.date === localDateStr &&
      remote.time === localTimeStr &&
      Math.abs(remoteValue - Number(localValue)) < 0.0001
    );
  }

  // Pool de concurrence : exécute `worker` sur chaque item avec au plus `limit` tâches simultanées
  async function runWithConcurrency<T>(
    items: T[],
    limit: number,
    worker: (item: T, index: number) => Promise<void>
  ) {
    let nextIndex = 0;
    const runWorker = async () => {
      while (nextIndex < items.length) {
        const current = nextIndex++;
        await worker(items[current], current);
      }
    };
    const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
    await Promise.all(workers);
  }

  // Fonction d'envoi d'un basal temporaire
  async function sendBasalToMyDiabby({
    token,
    basal,
    date,
    time
  }: {
    token: string;
    basal: string;
    date: string;
    time: string;
  }) {
    const url = "https://app.mydiabby.com/api/data";
    const body = new URLSearchParams({
      time,
      date,
      add: "true",
      dgnew: "false",
      "insulin[basal]": basal
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
      throw new Error("Erreur lors de l'envoi du basal temporaire à MyDiabby");
    }
    return response.json();
  }

  // Handler global pour l'envoi groupé
  const CONCURRENCY = 6;

  const handleSendAll = async () => {
    setStatus(null);
    setLoading(true);
    setProgress(0);
    setCancelRequested(false);
    cancelRef.current = false;
    setOpenSendModal(false);
    try {
      let totalSteps = 0;
      let doneSteps = 0;
      const bumpProgress = () => {
        doneSteps++;
        setProgress(Math.round((doneSteps / totalSteps) * 100));
      };

      // Récupère l'existant UNE seule fois (au lieu de 2x par type avant)
      const [mydiabbyGlycemiaList, mydiabbyBolusList, mydiabbyBasalList] =
        await Promise.all([
          sendGlycemia ? fetchMyDiabbyGlycemia(token) : Promise.resolve([] as MyDiabbyGlycemiaEntry[]),
          sendBolus ? fetchMyDiabbyBolus(token) : Promise.resolve([] as MyDiabbyGlycemiaEntry[]),
          sendBasal ? fetchMyDiabbyBasal(token) : Promise.resolve([] as MyDiabbyGlycemiaEntry[]),
        ]);

      // Pré-filtrage : ne garder que ce qui n'existe pas déjà côté MyDiabby
      const glycemiaToSend = sendGlycemia && data
        ? data.filter(
            (entry) => !mydiabbyGlycemiaList.some((remote: MyDiabbyGlycemiaEntry) => isSameGlycemia(entry, remote))
          )
        : [];
      const bolusTreatments = (sendBolus && treatments)
        ? treatments.filter(
            (entry) =>
              (entry.eventType === "Meal Bolus" || entry.eventType === "Correction Bolus") &&
              typeof entry.insulin === 'number' && entry.date
          )
        : [];
      const bolusToSend = bolusTreatments.filter(
        (local) => !mydiabbyBolusList.some((remote: MyDiabbyGlycemiaEntry) => isSameBolus(local, remote))
      );
      const basalTreatments = (sendBasal && treatments)
        ? treatments.filter(
            (entry) => entry.eventType === "Temp Basal" && typeof entry.rate === 'number' && entry.date
          )
        : [];
      const basalToSend = basalTreatments.filter(
        (local) => !mydiabbyBasalList.some((remote: MyDiabbyGlycemiaEntry) => isSameBasal(local, remote))
      );

      totalSteps = glycemiaToSend.length + bolusToSend.length + basalToSend.length;
      if (totalSteps === 0) {
        setStatus("Aucune donnée à envoyer (tout est déjà synchronisé).");
        setLoading(false);
        return;
      }

      // 1. Glycémies (batch par lots de BATCH_SIZE, fallback individuel si lot rejeté)
      if (glycemiaToSend.length > 0) {
        const BATCH_SIZE = 50;
        const prepared = glycemiaToSend.map((entry) => {
          const dateObj = new Date(entry.date);
          return {
            date: dateObj.toISOString().slice(0, 10),
            time: dateObj.toTimeString().slice(0, 5),
            glycemia: (entry.sgv / 100).toFixed(4),
          };
        });
        const batches: typeof prepared[] = [];
        for (let i = 0; i < prepared.length; i += BATCH_SIZE) {
          batches.push(prepared.slice(i, i + BATCH_SIZE));
        }
        await runWithConcurrency(batches, CONCURRENCY, async (batch) => {
          if (cancelRef.current) throw new Error("Envoi interrompu par l'utilisateur.");
          const ok = await sendGlycemiaBatchToMyDiabby({ token, entries: batch });
          if (ok) {
            for (let i = 0; i < batch.length; i++) bumpProgress();
            return;
          }
          // Lot rejeté → fallback : envoi individuel de chaque valeur du lot
          for (const e of batch) {
            if (cancelRef.current) throw new Error("Envoi interrompu par l'utilisateur.");
            await sendGlycemiaToMyDiabby({ token, glycemia: e.glycemia, date: e.date, time: e.time });
            bumpProgress();
          }
        });
      }

      // 2. Bolus (avec déduplication + concurrence)
      if (bolusToSend.length > 0) {
        await runWithConcurrency(bolusToSend, CONCURRENCY, async (entry) => {
          if (cancelRef.current) throw new Error("Envoi interrompu par l'utilisateur.");
          const dateObj = new Date(entry.date);
          const date = dateObj.toISOString().slice(0, 10);
          const time = dateObj.toTimeString().slice(0, 5);
          const bolus = typeof entry.insulin === 'number' ? entry.insulin.toFixed(4) : "0.0000";
          // Associer les glucides si possible (logique précédente)
          let carbs: string | undefined = undefined;
          if (entry.identifier) {
            const carbsEntry = treatments.find(
              (t) => t.carbs && t.identifier && t.identifier === entry.identifier
            );
            if (carbsEntry && typeof carbsEntry.carbs === "number") {
              carbs = carbsEntry.carbs.toString();
            }
          } else {
            const entryDate = new Date(entry.date).getTime();
            const carbsEntry = treatments.find(
              (t) =>
                t.carbs &&
                Math.abs(new Date(t.date).getTime() - entryDate) < 5 * 60 * 1000
            );
            if (carbsEntry && typeof carbsEntry.carbs === "number") {
              carbs = carbsEntry.carbs.toString();
            }
          }
          await sendBolusToMyDiabby({
            token,
            bolus,
            date,
            time,
            isCorrection: entry.eventType === "Correction Bolus",
            carbs,
          });
          bumpProgress();
        });
      }

      // 3. Basals temporaires (avec déduplication + concurrence)
      if (basalToSend.length > 0) {
        await runWithConcurrency(basalToSend, CONCURRENCY, async (entry) => {
          if (cancelRef.current) throw new Error("Envoi interrompu par l'utilisateur.");
          const dateObj = new Date(entry.date);
          const date = dateObj.toISOString().slice(0, 10);
          const time = dateObj.toTimeString().slice(0, 5);
          const basal = typeof entry.rate === 'number' ? entry.rate.toFixed(4) : "0.0000";
          await sendBasalToMyDiabby({ token, basal, date, time });
          bumpProgress();
        });
      }
      setStatus("Envoi terminé !");
      setCancelRequested(false);
      cancelRef.current = false;
    } catch (e: unknown) {
      setStatus(
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
        {isDemo ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {t('Demo.mydiabbyDisabled')}
          </p>
        ) : (
          <>
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
            {isLoggedIn && (
              <>
                {loading ? (
                  <Button
                    onClick={handleStop}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={cancelRequested}
                  >
                    {t('SendToMyDiabbyCard.stop')}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setOpenSendModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {t('SendToMyDiabbyCard.send')}
                    </Button>
                    <Dialog open={openSendModal} onOpenChange={setOpenSendModal}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('SendToMyDiabbyCard.modalTitle')}</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-2 py-2">
                          <label className="flex items-center gap-2">
                            <Checkbox checked={sendGlycemia} onCheckedChange={v => setSendGlycemia(!!v)} /> {t('SendToMyDiabbyCard.glycemiaLabel')}
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox checked={sendBolus} onCheckedChange={v => setSendBolus(!!v)} /> {t('SendToMyDiabbyCard.bolusLabel')}
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox checked={sendBasal} onCheckedChange={v => setSendBasal(!!v)} /> {t('SendToMyDiabbyCard.basalLabel')}
                          </label>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSendAll} className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {t('SendToMyDiabbyCard.sendSelected')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </>
            )}
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
          </>
        )}
      </CardContent>
      <CardFooter />
    </Card>
  );
}