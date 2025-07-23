"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers le français par défaut
    // Vérifier d'abord si on n'est pas déjà sur une route localisée
    const pathname = window.location.pathname;
    if (pathname === '/login') {
      router.replace('/fr/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirection...</p>
    </div>
  );
} 