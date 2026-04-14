"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ChecklistKey = "level" | "confirmation" | "rr";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    level: false,
    confirmation: false,
    rr: false,
  });

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  // 🔐 LOAD USER
  const loadUserData = async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;

    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single();

      setIsPro(profile?.is_pro ?? false);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // 📊 LOAD TRADES
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

  // 📈 GRAPH DATA
  const graphData = useMemo(() => {
    let cumulative = 0;

    return trades.map((t) => {
      cumulative += t.pnl;
      return {
        pnl: cumulative,
        discipline: t.valid ? 100 : 0,
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

  // ⛔ STOP FLASH
 if (!loading && !user) {
  window.location.href = "/";
  return null;
}

  if (loading) {
    return (
      <div style={{ color: "#00ffaa", padding: 40 }}>
        Loading...
      </div>
    );
  }

  // 📐 GRAPH CALC
  const pnls = graphData.map((g) => g.pnl);
  const maxPnl = Math.max(...pnls, 1);
  const minPnl = Math.min(...pnls, 0);
  const range = maxPnl - minPnl || 1;

  const pnlPath = graphData
    .map((d, i) => {
      const x = (i / Math.max(graphData.length - 1, 1)) * 100;
      const y = 100 - ((d.pnl - minPnl) / range) * 100;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  const disciplinePath = graphData
    .map((d, i) => {
      const x = (i / Math.max(graphData.length - 1, 1)) * 100;
      const y = 100 - d.discipline;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#fff",
        padding: 20,
        fontFamily: "sans-serif",
      }}
    >
      {/* HEADER */}
      <h1
        style={{
          color: "#00ffaa",
          fontSize: 40,
          textAlign: "center",
        }}
      >
        Trading Discipline
      </h1>

      <p style={{ textAlign: "center", marginTop: 10 }}>
        🔥 {trades.length} trades in a row
      </p>

      {/* CARDS */}
      <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
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
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </linearGradient>
    </defs>

    {(() => {
      if (graphData.length === 0) return null;

      // 👉 fake stretch om lite data
      const data =
        graphData.length < 10
          ? Array(10)
              .fill(graphData[0])
              .map((_, i) => graphData[i] || graphData[graphData.length - 1])
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

        const yBlue = 100 - d.discipline * 0.8 - 5;
        const yGreen = 100 - ((d.pnl - min) / range) * 100;

        blue += i === 0 ? `M ${x},${yBlue}` : ` L ${x},${yBlue}`;
        green += i === 0 ? `M ${x},${yGreen}` : ` L ${x},${yGreen}`;
      });

      const area = blue + ` L 100,100 L 0,100 Z`;

      return (
        <>
          {/* BLUE LINE */}
          <path
            d={blue}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 12px #3b82f6)",
            }}
          />

          {/* AREA */}
          <path d={area} fill="url(#g)" />

          {/* GREEN LINE */}
          <path
            d={green}
            fill="none"
            stroke="#00ffaa"
            strokeWidth="1"
            opacity="0.6"
          />
        </>
      );
    })()}
  </svg>
</div>

      {/* CHECKLIST */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
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
                flex: 1,
                padding: 14,
                borderRadius: 12,
                border: "1px solid #00ffaa",
                textAlign: "center",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {key.toUpperCase()}
            </div>
          )
        )}
      </div>

      {/* INPUT */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <input
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          placeholder="+100 / -50"
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: "#111",
            color: "#fff",
          }}
        />

        <button
          onClick={handleAddTrade}
          style={{
            background: isValid ? "#00ffaa" : "#ff4d4f",
            color: "#000",
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
          }}
        >
          {isValid ? "Log trade" : "Break"}
        </button>
      </div>

      {/* LOGOUT */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
        style={{
          marginTop: 40,
          background: "transparent",
          color: "#888",
          border: "none",
        }}
      >
        Logout
      </button>
    </div>
  );
}

const card = {
  flex: 1,
  background: "#0f172a",
  padding: 20,
  borderRadius: 16,
};