"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ChecklistKey = "level" | "confirmation" | "rr";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");
  const [loading, setLoading] = useState(true);

  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    level: false,
    confirmation: false,
    rr: false,
  });

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  // 🔐 USER
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    load();
  }, []);

  // 📊 TRADES
  useEffect(() => {
    if (!user) return;

    const loadTrades = async () => {
      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (data) setTrades(data);
    };

    loadTrades();
  }, [user]);

  // 📈 STATS
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

  // 📊 GRAPH DATA (running)
  const graphData = useMemo(() => {
    let cumulative = 0;
    let validCount = 0;

    return trades.map((t, i) => {
      cumulative += t.pnl;
      if (t.valid) validCount++;

      return {
        pnl: cumulative,
        discipline: (validCount / (i + 1)) * 100,
      };
    });
  }, [trades]);

  // ➕ ADD TRADE
  const handleAddTrade = async () => {
    if (!pnl || !user) return;

    const value = Number(pnl);

    const newTrade = {
      pnl: value,
      valid: isValid,
      user_id: user.id,
    };

    await supabase.from("trades").insert([newTrade]);
    setTrades((prev) => [...prev, newTrade]);
    setPnl("");
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  // 🔐 START VIEW
  if (!user) {
    return (
      <div style={center}>
        <h1 style={title}>Trading Discipline</h1>

        <button
          onClick={async () => {
            const { error } = await supabase.auth.signInWithPassword({
              email: "test@test.com",
              password: "123456",
            });

            if (!error) window.location.reload();
          }}
          style={btn}
        >
          Open app
        </button>
      </div>
    );
  }

  // 📈 GRAPH CALC
  const data =
    graphData.length < 2
      ? [...graphData, ...(graphData[0] ? [graphData[0]] : [])]
      : graphData;

  const pnls = data.map((d) => d.pnl);
  const max = Math.max(...pnls, 1);
  const min = Math.min(...pnls, 0);
  const range = max - min || 1;

  const total = data.length;

  let blue = "";
  let green = "";

  data.forEach((d, i) => {
    const x = (i / (total - 1)) * 100;

    const yBlue = 100 - d.discipline * 0.9;
    const yGreen = 100 - ((d.pnl - min) / range) * 100;

    blue += i === 0 ? `M ${x},${yBlue}` : ` L ${x},${yBlue}`;
    green += i === 0 ? `M ${x},${yGreen}` : ` L ${x},${yGreen}`;
  });

  const area = blue + ` L 100,100 L 0,100 Z`;

  return (
    <div style={container}>
      <h1 style={title}>Trading Discipline</h1>

      {/* CARDS */}
      <div style={row}>
        <div style={card}>
          <p>PnL</p>
          <h2>${stats.pnl}</h2>
        </div>

        <div style={card}>
          <p>Discipline</p>
          <h2>{stats.discipline}%</h2>
        </div>
      </div>

    {/* GRAPH */}
{(() => {
  const data =
    graphData.length < 2
      ? [...graphData, ...(graphData[0] ? [graphData[0]] : [])]
      : graphData;

  const pnls = data.map((d) => d.pnl);

  const max = Math.max(...pnls, 1);
  const min = Math.min(...pnls, 0);
  const range = max - min || 1;

  // 🔥 bättre balans (fix spikes)
  const padding = range * 0.35;
  const adjustedMin = min - padding;
  const adjustedMax = max + padding;
  const adjustedRange = adjustedMax - adjustedMin;

  const total = data.length;

  let blue = "";
  let green = "";

  data.forEach((d, i) => {
    const x = total === 1 ? 0 : (i / (total - 1)) * 100;

    // 🔵 discipline (hero line)
    const yBlue = 100 - d.discipline * 0.8 - 5;

    // 🟢 pnl (balanced)
    const yGreen =
      100 - ((d.pnl - adjustedMin) / adjustedRange) * 100;

    blue += i === 0 ? `M ${x},${yBlue}` : ` L ${x},${yBlue}`;
    green += i === 0 ? `M ${x},${yGreen}` : ` L ${x},${yGreen}`;
  });

  const area = blue + ` L 100,100 L 0,100 Z`;

  return (
    <div
      style={{
        marginTop: 30,
        background: "#0f172a",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="220"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* blå gradient */}
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>

          {/* subtle fade */}
          <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 🔵 BLUE GLOW LINE */}
        <path
          d={blue}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{
            filter:
              "drop-shadow(0 0 12px #3b82f6) drop-shadow(0 0 20px rgba(59,130,246,0.5))",
          }}
        />

        {/* 🔵 AREA */}
        <path d={area} fill="url(#g)" />

        {/* 🟢 GREEN LINE (subtle) */}
        <path
          d={green}
          fill="none"
          stroke="#00ffaa"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* ✨ FADE OVERLAY */}
        <rect x="0" y="0" width="100" height="100" fill="url(#fade)" />
      </svg>
    </div>
  );
})()}

      {/* CHECKLIST */}
      <div style={row}>
        {(["level", "confirmation", "rr"] as ChecklistKey[]).map(
          (key) => (
            <div
              key={key}
              onClick={() =>
                setChecklist({
                  ...checklist,
                  [key]: !checklist[key],
                })
              }
              style={{
                ...check,
                borderColor: checklist[key]
                  ? "#00ffaa"
                  : "#333",
              }}
            >
              {key.toUpperCase()}
            </div>
          )
        )}
      </div>

      {/* INPUT */}
      <div style={row}>
        <input
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          style={input}
        />

        <button onClick={handleAddTrade} style={btn}>
          {isValid ? "Log" : "Break"}
        </button>
      </div>

      {/* LOGOUT */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.reload();
        }}
        style={logout}
      >
        Logout
      </button>
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

const title: React.CSSProperties = {
  textAlign: "center",
  color: "#00ffaa",
  fontSize: 40,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 20,
};

const card: React.CSSProperties = {
  flex: 1,
  background: "#0f172a",
  padding: 20,
  borderRadius: 16,
};

const check: React.CSSProperties = {
  flex: 1,
  padding: 14,
  borderRadius: 12,
  border: "1px solid",
  textAlign: "center",
  cursor: "pointer",
  fontWeight: "bold",
};

const input: React.CSSProperties = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "#111",
  color: "#fff",
};

const btn: React.CSSProperties = {
  background: "#00ffaa",
  color: "#000",
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
};

const logout: React.CSSProperties = {
  marginTop: 30,
  background: "transparent",
  color: "#888",
  border: "none",
};

const center: React.CSSProperties = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  background: "#020617",
  color: "#fff",
};