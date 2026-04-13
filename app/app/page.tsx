"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type ChecklistKey = "level" | "confirmation" | "rr";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
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

  // NORMALIZE GRAPH
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
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.btnPrimary}
          onClick={async () => {
            if (!email) {
              alert("Enter email");
              return;
            }

            console.log("LOGIN CLICK");

            try {
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  emailRedirectTo:
                    window.location.origin + "/auth/callback",
                },
              });

              if (error) {
                console.error("LOGIN ERROR:", error);
                alert(error.message);
              } else {
                alert("Magic link sent ✉️");
              }
            } catch (err) {
              console.error("LOGIN CRASH:", err);
              alert("Something went wrong");
            }
          }}
        >
          Send Magic Link
        </button>

        <p style={styles.helper}>
          We’ll send you a login link
        </p>
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
          {[
            { key: "level", label: "Level" },
            { key: "confirmation", label: "Confirmation" },
            { key: "rr", label: "RR" },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                ...styles.checkItem,
                border: checklist[item.key as ChecklistKey]
                  ? "1px solid #00ffaa"
                  : "1px solid #333",
              }}
              onClick={() =>
                setChecklist({
                  ...checklist,
                  [item.key as ChecklistKey]:
                    !checklist[item.key as ChecklistKey],
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
        <div style={{ marginTop: 20 }}>
          <svg width="100%" height="160">
            {graphData.map((d, i) => {
              if (i === 0) return null;

              const prev = graphData[i - 1];

              const x1 = ((i - 1) / graphData.length) * 100;
              const x2 = (i / graphData.length) * 100;

              const y1 =
                100 - ((prev.pnl - min) / range) * 100;
              const y2 =
                100 - ((d.pnl - min) / range) * 100;

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

        {/* CHECKOUT */}
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/checkout", {
                method: "POST",
              });

              if (!res.ok) throw new Error("API error");

              const data = await res.json();

              if (data?.url) {
                window.location.assign(data.url);
              } else {
                alert("Checkout failed");
              }
            } catch (err) {
              console.error(err);
              alert("Something went wrong");
            }
          }}
          style={styles.btnPrimary}
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
  page: {
    background: "#020617",
    minHeight: "100vh",
    padding: 20,
  },

  container: {
    maxWidth: 500,
    margin: "0 auto",
    color: "#fff",
  },

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
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
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
    outline: "none",
    fontSize: 14,
    marginBottom: 15,
  },

  helper: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 13,
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

  logout: {
    marginTop: 30,
    color: "#888",
  },
};