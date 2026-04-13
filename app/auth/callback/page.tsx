"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Callback() {
  useEffect(() => {
    const run = async () => {
      await supabase.auth.getSession();

      window.location.href = "/app";
    };

    run();
  }, []);

  return <p>Logging you in...</p>;
}