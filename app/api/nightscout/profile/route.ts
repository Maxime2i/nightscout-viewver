import { NextRequest, NextResponse } from "next/server";
import {
  isDemoMode,
  generateDemoProfile,
  DEMO_NIGHTSCOUT_TOKEN,
} from "@/lib/demoData";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, token } = body as { url: string; token: string };

    if (isDemoMode(url)) {
      if (token !== DEMO_NIGHTSCOUT_TOKEN) {
        return NextResponse.json({ error: "Token demo invalide" }, { status: 401 });
      }
      return NextResponse.json(generateDemoProfile());
    }

    if (!url || !token) {
      return NextResponse.json(
        { error: "url et token sont requis" },
        { status: 400 }
      );
    }

    const baseUrl = url.replace(/\/$/, "");
    const headers = {
      Accept: "application/json",
      "API-SECRET": token,
    };
    const qs = `token=${encodeURIComponent(token)}`;

    const tryFetch = (path: string) =>
      fetch(`${baseUrl}${path}?${qs}`, { headers, next: { revalidate: 0 } });

    let res = await tryFetch("/api/v1/profile.json");
    if (res.status === 404) {
      res = await tryFetch("/api/v1/profile");
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
    console.error("[api/nightscout/profile]", e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    );
  }
}
