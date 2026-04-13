"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type ChecklistKey = "level" | "confirmation" | "rr";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");

  const [isPro, setIsPro] = useState(false);

  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");

  const [feedback, setFeedback] = useState("");

  const [streak, setStreak] = useState(0);
  const [lastDate, setLastDate] = useState("");

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

    // TEMP
    setIsPro(true);

    const savedStreak = localStorage.getItem("streak");
    const savedDate = localStorage.getItem("lastDate");

    if (savedStreak) setStreak(Number(savedStreak));
    if (savedDate) setLastDate(savedDate);
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

  // 📈 GRAPH DATA
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

  // ADD TRADE
  const handleAddTrade = async () => {
    if (!pnl || !user) return;

    const value = Number(pnl.replace(",", "."));
    if (isNaN(value)) return;

    const newTrade = { pnl: value, valid: isValid };

    await supabase.from("trades").insert([
      { ...newTrade, user_id: user.id },
    ]);

    const newTrades = [...trades, newTrade];
    setTrades(newTrades);
    setPnl("");

    setFeedback(
      isValid
        ? "✅ You followed your system"
        : "❌ You broke your rules"
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

              if (error) {
                alert(error.message);
              } else {
                alert("Check mail ✉️");
              }
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

        <p style={{ textAlign: "center" }}>🔥 {streak} days</p>

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
          {([
            { key: "level", label: "Level" },
            { key: "confirmation", label: "Confirmation" },
            { key: "rr", label: "RR" },
          ] as { key: ChecklistKey; label: string }[]).map((item) => (
            <div
              key={item.key}
              style={{
                ...styles.checkItem,
                border: checklist[item.key]
                  ? "1px solid #00ffaa"
                  : "1px solid #333",
              }}
              onClick={() =>
                setChecklist({
                  ...checklist,
                  [item.key]: !checklist[item.key],
                })
              }
            >
              {item.label}
            </div>
          ))}
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

        {/* 📈 GRAPH */}
        <div style={{ marginTop: 30 }}>
          <svg width="100%" height="200">
            {graphData.map((d, i) => {
              if (i === 0) return null;
              const prev = graphData[i - 1];

              const x1 = ((i - 1) / graphData.length) * 100;
              const x2 = (i / graphData.length) * 100;

              const y1 = 100 - prev.pnl;
              const y2 = 100 - d.pnl;

              return (
                <line
                  key={i}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="#00ffaa"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {!isPro ? (
          <button style={styles.btnPrimary}>
            Upgrade to Pro 🚀
          </button>
        ) : (
          <div style={{ color: "#00ffaa", textAlign: "center" }}>
            ✅ You are Pro
          </div>
        )}

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
    padding: 10,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  logout: { marginTop: 20, color: "#888" },
};