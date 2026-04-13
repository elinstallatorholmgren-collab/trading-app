"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Callback() {
  useEffect(() => {
    const run = async () => {
      console.log("CALLBACK START");

      try {
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(
            window.location.href
          );

        console.log("SESSION:", data);
        console.log("ERROR:", error);
      } catch (err) {
        console.error("CRASH:", err);
      }

      // 🔥 ALWAYS redirect after 1 sec (fail-safe)
      setTimeout(() => {
        window.location.href = "/app";
      }, 1000);
    };

    run();
  }, []);

  return <p>Logging you in...</p>;
}