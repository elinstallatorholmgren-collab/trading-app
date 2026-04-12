"use client";

const [isPro, setIsPro] = useState(false);

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type ChecklistKey = "level" | "confirmation" | "rr";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");

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
	if (data && data.length > 0) {
	  setIsPro(data[0].is_pro || false);
	}
      });

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

    // 🧠 FEEDBACK
    if (isValid) {
      setFeedback("✅ You followed your system");
    } else {
      setFeedback("❌ You broke your rules");
    }

    // 📊 DISCIPLINE
    let validCount = 0;
    newTrades.forEach((t) => {
      if (t.valid) validCount++;
    });

    const discipline = Math.round(
      (validCount / newTrades.length) * 100
    );

    if (discipline < 60) {
      setFeedback("⚠️ You're trading emotionally");
    }

    // 🔥 STREAK
    const today = new Date().toLocaleDateString("sv-SE");

    const disciplinedDay =
      newTrades.length < 3
        ? discipline === 100
        : discipline >= 80;

    if (!isValid) {
      setFeedback("⚠️ This trade breaks your streak");
    }

    if (disciplinedDay) {
      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.toLocaleDateString("sv-SE");

        if (lastDate === y) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem("streak", String(newStreak));
        } else {
          setStreak(1);
          localStorage.setItem("streak", "1");
        }

        setLastDate(today);
        localStorage.setItem("lastDate", today);
      }
    } else {
      setStreak(0);
      localStorage.setItem("streak", "0");
    }
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

        {/* FEEDBACK */}
        {feedback && (
          <p style={{ textAlign: "center", marginTop: 10 }}>
            {feedback}
          </p>
        )}

        {/* STREAK */}
        <p style={{ textAlign: "center" }}>
          🔥 {streak} days
        </p>

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
              const pnls = graphData.map((g) => g.pnl);
              const maxPnl = Math.max(...pnls, 1);
              const minPnl = Math.min(...pnls, 0);
              const range = maxPnl - minPnl || 1;

              return graphData.map((d, i) => {
                if (i === 0) return null;
                const prev = graphData[i - 1];

                const x1 = ((i - 1) / graphData.length) * 100;
                const x2 = (i / graphData.length) * 100;

                const y1 = 100 - ((prev.pnl - minPnl) / range) * 100;
                const y2 = 100 - ((d.pnl - minPnl) / range) * 100;

                const d1 = 100 - prev.discipline;
                const d2 = 100 - d.discipline;

                return (
                  <g key={i}>
                    <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="#00ffaa" strokeWidth="2"/>
                    <line x1={`${x1}%`} y1={`${d1}%`} x2={`${x2}%`} y2={`${d2}%`} stroke="#3b82f6" strokeWidth="2"/>
                  </g>
                );
              });
            })()}
          </svg>
        </div>

{!isPro ? (
  <button
    onClick={async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
      });
      const data = await res.json();
      window.location.href = data.url;
    }}
    style={{
      marginTop: 30,
      padding: 14,
      background: "linear-gradient(90deg,#00ffaa,#00cc88)",
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      width: "100%",
      fontWeight: "bold",
      fontSize: 16
    }}
  >
    Upgrade to Pro 🚀
  </button>
) : (
  <div style={{
    marginTop: 30,
    padding: 14,
    background: "#00ffaa22",
    borderRadius: 10,
    textAlign: "center",
    color: "#00ffaa",
    fontWeight: "bold"
  }}>
    ✅ You are Pro
  </div>
)}
        <button onClick={() => supabase.auth.signOut()} style={styles.logout}>
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
  status: { textAlign: "center", padding: 10, borderRadius: 10, marginBottom: 10 },
  grid: { display: "flex", gap: 12, marginBottom: 15 },
  cardSmall: { flex: 1, background: "#111827", padding: 15, borderRadius: 10 },
  checklist: { display: "flex", gap: 10, marginBottom: 15 },
  checkItem: { flex: 1, padding: 10, textAlign: "center", borderRadius: 8, cursor: "pointer" },
  inputRow: { display: "flex", gap: 10 },
  input: { flex: 1, padding: 10, borderRadius: 8, border: "none" },
  btnPrimary: { padding: 10, borderRadius: 8, border: "none", cursor: "pointer" },
  logout: { marginTop: 20, color: "#888" },
};