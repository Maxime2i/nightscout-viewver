import { NextRequest, NextResponse } from "next/server";
import {
  isDemoMode,
  generateDemoEntries,
  DEMO_NIGHTSCOUT_TOKEN,
} from "@/lib/demoData";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, token, from, to } = body as {
      url: string;
      token: string;
      from: number;
      to: number;
    };

    if (isDemoMode(url)) {
      if (token !== DEMO_NIGHTSCOUT_TOKEN) {
        return NextResponse.json({ error: "Token demo invalide" }, { status: 401 });
      }
      return NextResponse.json(generateDemoEntries(from, to));
    }

    if (!url || !token || from == null || to == null) {
      return NextResponse.json(
        { error: "url, token, from et to sont requis" },
        { status: 400 }
      );
    }

    const baseUrl = url.replace(/\/$/, "");
    const searchParams = new URLSearchParams({
      token,
      "find[date][$gte]": String(from),
      "find[date][$lte]": String(to),
      count: "10000",
    });
    const qs = searchParams.toString();
    const headers = {
      Accept: "application/json",
      "API-SECRET": token,
    };

    const tryFetch = (path: string) =>
      fetch(`${baseUrl}${path}?${qs}`, {
        headers,
        next: { revalidate: 0 },
      });

    let res = await tryFetch("/api/v1/entries.json");
    if (res.status === 404) {
      res = await tryFetch("/api/v1/entries");
    }

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Nightscout: ${res.status}`, details: text.slice(0, 200) },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/nightscout/entries]", e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des entries" },
      { status: 500 }
    );
  }
}
