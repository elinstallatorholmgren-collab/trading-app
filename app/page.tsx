"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");

  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");

  const [checklist, setChecklist] = useState({
    level: false,
    confirmation: false,
    rr: false,
  });

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  // AUTH
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
  }, []);

  // LOAD
  useEffect(() => {
    if (!user) return;

    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
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

  // ADD TRADE
  const handleAddTrade = async () => {
    if (!pnl || !user) return;

    const value = Number(pnl.replace(",", "."));
    if (isNaN(value)) return;

    await supabase.from("trades").insert([
      {
        pnl: value,
        valid: isValid,
        user_id: user.id,
      },
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
            style={styles.buttonPrimary}
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
        <div style={{
          ...styles.badge,
          background: isValid ? "#00ffaa22" : "#ff4d4f22",
          color: isValid ? "#00ffaa" : "#ff4d4f"
        }}>
          {isValid ? "VALID" : "INVALID"}
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
          {["level", "confirmation", "rr"].map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                onChange={(e) =>
                  setChecklist({
                    ...checklist,
                    [key]: e.target.checked,
                  })
                }
              />
              {key}
            </label>
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
              ...styles.buttonPrimary,
              background: isValid ? "#00ffaa" : "#ff4d4f",
            }}
          >
            {isValid ? "Log" : "Break"}
          </button>
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

// 🎨 STYLES
const styles: any = {
  page: {
    background: "#020617",
    minHeight: "100vh",
    padding: 20,
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    color: "#fff",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#020617",
  },
  title: {
    textAlign: "center",
    fontSize: 36,
    marginBottom: 20,
    color: "#00ffaa",
  },
  card: {
    background: "#111827",
    padding: 30,
    borderRadius: 12,
    width: 300,
  },
  cardSmall: {
    background: "#111827",
    padding: 20,
    borderRadius: 12,
    flex: 1,
  },
  grid: {
    display: "flex",
    gap: 16,
    marginBottom: 20,
  },
  inputRow: {
    display: "flex",
    gap: 10,
    marginTop: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
  },
  buttonPrimary: {
    padding: 10,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  badge: {
    textAlign: "center",
    padding: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  checklist: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: 10,
  },
  logout: {
    marginTop: 20,
    background: "transparent",
    color: "#aaa",
  },
};