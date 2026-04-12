"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type ChecklistKey = "level" | "confirmation" | "rr";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");

  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");

  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    level: false,
    confirmation: false,
    rr: false,
  });

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  // AUTH
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user || null)
    );
  }, []);

  // LOAD
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

  // GRAPH
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

    await supabase.from("trades").insert([
      { pnl: value, valid: isValid, user_id: user.id },
    ]);

    setTrades((prev) => [...prev, { pnl: value, valid: isValid }]);
    setPnl("");
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
              await supabase.auth.signInWithOtp({ email });
              alert("Check mail ✉️");
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

        {/* STATUS */}
        <div
          style={{
            ...styles.status,
            background: isValid ? "#00ffaa22" : "#ff4d4f22",
            color: isValid ? "#00ffaa" : "#ff4d4f",
          }}
        >
          {isValid ? "VALID SETUP" : "INVALID SETUP"}
        </div>

        {/* CARDS */}
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
          {(
            [
              { key: "level", label: "Level" },
              { key: "confirmation", label: "Confirmation" },
              { key: "rr", label: "RR" },
            ] as { key: ChecklistKey; label: string }[]
          ).map((item) => (
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

      {/* GRAPH */}
<div style={{ marginTop: 30 }}>
  <svg width="100%" height="200">
    {(() => {
      const pnls = graphData.map(g => g.pnl);

      const maxPnl = Math.max(...pnls, 1);
      const minPnl = Math.min(...pnls, 0);

      const range = maxPnl - minPnl || 1;

      return graphData.map((d, i) => {
        if (i === 0) return null;
        const prev = graphData[i - 1];

        const x1 = ((i - 1) / graphData.length) * 100;
        const x2 = (i / graphData.length) * 100;

        // 🟢 PNL (full range scaling)
        const y1 = 100 - ((prev.pnl - minPnl) / range) * 100;
        const y2 = 100 - ((d.pnl - minPnl) / range) * 100;

        // 🔵 DISCIPLINE (same vertical system)
        const d1 = 100 - (prev.discipline / 100) * 100;
        const d2 = 100 - (d.discipline / 100) * 100;

        return (
          <g key={i}>
            <line
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="#00ffaa"
              strokeWidth="2"
            />
            <line
              x1={`${x1}%`}
              y1={`${d1}%`}
              x2={`${x2}%`}
              y2={`${d2}%`}
              stroke="#3b82f6"
              strokeWidth="2"
            />
          </g>
        );
      });
    })()}
  </svg>
</div>

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
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#020617" },
  title: { textAlign: "center", fontSize: 32, color: "#00ffaa", marginBottom: 20 },
  status: { textAlign: "center", padding: 10, borderRadius: 10, marginBottom: 15 },
  grid: { display: "flex", gap: 12, marginBottom: 15 },
  cardSmall: { flex: 1, background: "#111827", padding: 15, borderRadius: 10 },
  checklist: { display: "flex", gap: 10, marginBottom: 15 },
  checkItem: { flex: 1, padding: 10, textAlign: "center", borderRadius: 8, cursor: "pointer" },
  inputRow: { display: "flex", gap: 10 },
  input: { flex: 1, padding: 10, borderRadius: 8, border: "none" },
  btnPrimary: { padding: 10, borderRadius: 8, border: "none", cursor: "pointer" },
  logout: { marginTop: 20, color: "#888" },
};