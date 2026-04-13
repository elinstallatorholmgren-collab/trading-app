"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type ChecklistKey = "level" | "confirmation" | "rr";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(true);

  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");
  const [feedback, setFeedback] = useState("");

  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    level: false,
    confirmation: false,
    rr: false,
  });

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  // AUTH
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // LOAD
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: tradesData } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (tradesData) setTrades(tradesData);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single();

      if (profile) setIsPro(profile.is_pro);
    };

    load();
  }, [user]);

  // STATS
  const stats = useMemo(() => {
    let total = 0;
    let valid = 0;

    trades.forEach((t) => {
      total += t.pnl;
      if (t.valid) valid++;
    });

    return {
      pnl: total,
      discipline:
        trades.length > 0
          ? Math.round((valid / trades.length) * 100)
          : 0,
    };
  }, [trades]);

  // GRAPH DATA
  const graphData = useMemo(() => {
    let pnlRunning = 0;
    let validCount = 0;

    return trades.map((t, i) => {
      pnlRunning += t.pnl;
      if (t.valid) validCount++;

      return {
        pnl: pnlRunning,
        discipline: Math.round((validCount / (i + 1)) * 100),
      };
    });
  }, [trades]);

  const pnls = graphData.map((g) => g.pnl);
  const max = Math.max(...pnls, 1);
  const min = Math.min(...pnls, 0);
  const range = max - min || 1;

  const clamp = (v: number) => Math.max(5, Math.min(95, v));
  const amplify = 1.4;

  const last = graphData.at(-1);
  const prev = graphData.at(-2);

  const improving =
    last && prev ? last.discipline > prev.discipline : true;

  // ADD TRADE
  const handleAddTrade = async () => {
    if (!pnl || !user) return;

    const value = Number(pnl.replace(",", "."));
    if (isNaN(value)) return;

    const newTrade = { pnl: value, valid: isValid };

    await supabase.from("trades").insert([
      { ...newTrade, user_id: user.id },
    ]);

    setTrades([...trades, newTrade]);
    setPnl("");
  };

  // LOGIN
  if (!user) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.title}>Trading Discipline</h1>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <button
            disabled={loading}
            style={{
              ...styles.btnPrimary,
              opacity: loading ? 0.6 : 1,
            }}
            onClick={async () => {
              if (!email || loading) return;

              setLoading(true);

              try {
                const { error } =
                  await supabase.auth.signInWithOtp({
                    email,
                    options: {
                      emailRedirectTo:
                        window.location.origin +
                        "/auth/callback",
                    },
                  });

                if (error) {
                  alert(error.message);
                  setLoading(false);
                } else {
                  alert("Magic link sent ✉️");
                  setTimeout(() => setLoading(false), 10000);
                }
              } catch {
                setLoading(false);
              }
            }}
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>

          <p style={styles.helper}>
            We’ll send you a login link
          </p>
        </div>
      </div>
    );
  }

  // MAIN UI
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Trading Discipline</h1>

        {/* STATS */}
        <div style={styles.grid}>
          <div style={styles.cardSmall}>
            <p>PnL</p>
            <h2>${stats.pnl}</h2>
          </div>

          <div style={styles.cardSmall}>
            <p>Discipline</p>
            <h2>{stats.discipline}%</h2>
          </div>
        </div>

        {/* CHECKLIST */}
        <div style={styles.checklist}>
          {(["level", "confirmation", "rr"] as ChecklistKey[]).map(
            (key) => (
              <div
                key={key}
                style={{
                  ...styles.checkItem,
                  border: checklist[key]
                    ? "1px solid #00ffaa"
                    : "1px solid #333",
                }}
                onClick={() =>
                  setChecklist({
                    ...checklist,
                    [key]: !checklist[key],
                  })
                }
              >
                {key}
              </div>
            )
          )}
        </div>

        {/* INPUT */}
        <div style={styles.inputRow}>
          <input
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            placeholder="+100 / -50"
            style={styles.input}
          />

          <button
            onClick={handleAddTrade}
            style={styles.btnPrimary}
          >
            {isValid ? "Log" : "Break"}
          </button>
        </div>

        {/* STATUS */}
        <p
          style={{
            marginTop: 20,
            color: improving ? "#00ffaa" : "#ff4d4f",
          }}
        >
          {improving ? "Improving" : "Slipping"}
        </p>

        {/* CHECKOUT */}
        <button
          onClick={async () => {
            const res = await fetch("/api/checkout", {
              method: "POST",
            });
            const data = await res.json();
            if (data?.url) window.location.assign(data.url);
          }}
          style={styles.btnPrimary}
        >
          Unlock your discipline
        </button>

        {/* LOGOUT */}
        <button
          onClick={() => supabase.auth.signOut()}
          style={styles.logout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  page: { background: "#020617", minHeight: "100vh", padding: 20 },
  container: { maxWidth: 500, margin: "0 auto", color: "#fff" },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#020617",
  },
  card: {
    background: "#0f172a",
    padding: 30,
    borderRadius: 16,
    width: 320,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    color: "#00ffaa",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #1f2937",
    background: "#020617",
    color: "#fff",
    marginBottom: 15,
  },
  btnPrimary: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "#00ffaa",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
  helper: { color: "#888", fontSize: 13 },
  grid: { display: "flex", gap: 10 },
  cardSmall: { flex: 1, background: "#111827", padding: 10 },
  checklist: { display: "flex", gap: 10, marginTop: 10 },
  checkItem: { flex: 1, padding: 10, textAlign: "center", cursor: "pointer" },
  inputRow: { display: "flex", gap: 10 },
  logout: { marginTop: 30 },
};