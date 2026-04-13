"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Callback() {
  useEffect(() => {
    const run = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Auth error:", error);
      }

      window.location.href = "/app";
    };

    run();
  }, []);

  return <p>Logging you in...</p>;
}