"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type ChecklistKey = "level" | "confirmation" | "rr";

export default function Page() {
  console.log("PAGE RENDER");
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isPro, setIsPro] = useState(true); // TEMP

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

  // LOAD DATA
  useEffect(() => {
    if (!user) return;

    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setTrades(data);
      });
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

  const clamp = (v: number) => Math.max(5, Math.min(95, v));
  const amplify = 1.4;

  const last = graphData.length > 0 ? graphData[graphData.length - 1] : null;
  const prev = graphData.length > 1 ? graphData[graphData.length - 2] : null;

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

    setFeedback(
      isValid
        ? "You followed your system"
        : "You broke your rules"
    );
  };

  // LOGIN
  if (!user) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={styles.title}>Trading Discipline</h1>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <button
            style={styles.btnPrimary}
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  emailRedirectTo:
                    "https://trading-app-three-gamma.vercel.app/auth/callback",
                },
              });

              if (error) alert(error.message);
              else alert("Check mail");
            }}
          >
            Send Magic Link
          </button>
        </div>
      </div>
    );
  }

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
            style={{
              ...styles.btnPrimary,
              background: isValid ? "#00ffaa" : "#ff4d4f",
            }}
          >
            {isValid ? "Log" : "Break"}
          </button>
        </div>

        {/* GRAPH */}
        <div style={{ marginTop: 20 }}>
          <svg width="100%" height="160">
            {graphData.map((d, i) => {
              if (i === 0) return null;

              const prev = graphData[i - 1];

              const x1 = ((i - 1) / graphData.length) * 100;
              const x2 = (i / graphData.length) * 100;

              const y1 = 100 - prev.pnl;
              const y2 = 100 - d.pnl;

              const d1 = clamp(50 - (prev.discipline - 50) * amplify);
              const d2 = clamp(50 - (d.discipline - 50) * amplify);

              return (
                <g key={i}>
                  <line
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke="#00ffaa33"
                    strokeWidth="2"
                  />

                  <line
                    x1={`${x1}%`}
                    y1={`${d1}%`}
                    x2={`${x2}%`}
                    y2={`${d2}%`}
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                </g>
              );
            })}
          </svg>
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

        {/* CHECKOUT BUTTON */}
        <button
          onClick={async () => {
            console.log("CLICK");

            const res = await fetch("/api/checkout", {
              method: "POST",
            });

            const data = await res.json();
            console.log(data);

            if (data?.url) {
              window.location.href = data.url;
            } else {
              alert("Checkout failed");
            }
          }}
          style={{
            marginTop: 20,
            padding: 16,
            width: "100%",
            background: "#00ffaa",
            color: "#000",
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Unlock your discipline
        </button>

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
  title: {
    textAlign: "center",
    fontSize: 32,
    color: "#00ffaa",
    marginBottom: 20,
  },
  grid: { display: "flex", gap: 12, marginBottom: 15 },
  cardSmall: {
    flex: 1,
    background: "#111827",
    padding: 15,
    borderRadius: 10,
  },
  checklist: { display: "flex", gap: 10, marginBottom: 15 },
  checkItem: {
    flex: 1,
    padding: 10,
    textAlign: "center",
    borderRadius: 8,
    cursor: "pointer",
  },
  inputRow: { display: "flex", gap: 10 },
  input: { flex: 1, padding: 10, borderRadius: 8, border: "none" },
  btnPrimary: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  logout: { marginTop: 30, color: "#888" },
};