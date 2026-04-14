"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    load();
  }, []);

  // 👉 redirect om inloggad
  useEffect(() => {
    if (user) {
      window.location.href = "/app";
    }
  }, [user]);

  return (
    <div style={container}>
      <div style={hero}>
        <h1 style={title}>Trading Discipline</h1>

        <p style={subtitle}>
          Most traders don’t lose money because of strategy.
          <br />
          They lose because they break their rules.
        </p>

        <button
          style={cta}
          onClick={async () => {
            const { error } = await supabase.auth.signInWithPassword({
              email: "test@test.com",
              password: "123456",
            });

            if (!error) window.location.href = "/app";
          }}
        >
          Open App
        </button>

        <div style={bullets}>
          <p>✓ Track discipline</p>
          <p>✓ Build streaks</p>
          <p>✓ Stop breaking your rules</p>
        </div>
      </div>

      <div style={pricing}>
        <h2>Simple pricing</h2>
        <p style={price}>$8/month</p>
      </div>
    </div>
  );
}

/* STYLES */
const container: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "#fff",
  padding: 20,
};

const hero: React.CSSProperties = {
  maxWidth: 500,
  margin: "0 auto",
  textAlign: "center",
  paddingTop: 80,
};

const title: React.CSSProperties = {
  color: "#00ffaa",
  fontSize: 42,
  marginBottom: 20,
};

const subtitle: React.CSSProperties = {
  color: "#aaa",
  fontSize: 18,
  lineHeight: 1.6,
  marginBottom: 30,
};

const cta: React.CSSProperties = {
  background: "#00ffaa",
  color: "#000",
  padding: "14px 24px",
  borderRadius: 12,
  border: "none",
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
};

const bullets: React.CSSProperties = {
  marginTop: 40,
  color: "#ccc",
  lineHeight: 1.8,
};

const pricing: React.CSSProperties = {
  marginTop: 80,
  background: "#0f172a",
  borderRadius: 20,
  padding: 30,
  textAlign: "center",
  maxWidth: 400,
  marginLeft: "auto",
  marginRight: "auto",
};

const price: React.CSSProperties = {
  color: "#00ffaa",
  fontSize: 24,
  marginTop: 10,
};