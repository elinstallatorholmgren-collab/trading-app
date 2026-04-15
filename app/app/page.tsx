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
  const [flash, setFlash] = useState<"none" | "bad" | "good">("none");

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
  let validCount = 0;

  return trades.map((t, i) => {
    cumulative += Number(t.pnl) || 0;

    const isValid = t.valid === true;

    if (isValid) validCount++;

    return {
      pnl: cumulative,
      discipline: Math.round((validCount / (i + 1)) * 100),
    };
  });
}, [trades]);

const today = new Date().toLocaleDateString("sv-SE");

const todayTrades = trades.filter((t) => {
  if (!t.created_at) return false;

  const d = new Date(t.created_at).toLocaleDateString("sv-SE");
  return d === today;
});

const todayDiscipline =
  todayTrades.length > 0
    ? Math.round(
        (todayTrades.filter((t) => t.valid === true).length /
          todayTrades.length) *
          100
      )
    : 0;

const streak = useMemo(() => {
  if (!trades.length) return 0;

  // 👉 skapa map per dag (EN gång per dag)
  const daysMap = new Map<string, { total: number; valid: number }>();

  trades.forEach((t) => {
    const date = t.created_at
      ? new Date(t.created_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    if (!daysMap.has(date)) {
      daysMap.set(date, { total: 0, valid: 0 });
    }

    const day = daysMap.get(date)!;
    day.total++;
    if (t.valid === true) day.valid++;



  });

  // 👉 gör array av UNIKA dagar
  const days = Array.from(daysMap.entries()).sort(
    ([a], [b]) => (a > b ? -1 : 1)
  );

  // 👉 streak = antal dagar i rad ≥80%
  let count = 0;

  for (const [, d] of days) {
    const discipline = Math.round((d.valid / d.total) * 100);

    if (discipline >= 80) {
      count++;
    } else {
      break;
    }
  }

  return count;
}, [trades]);

let streakColor = "#666";
let streakGlow = "none";

if (streak >= 2) streakColor = "#22c55e";
if (streak >= 4) streakColor = "#00ffaa";
if (streak >= 7) {
  streakColor = "#00ffaa";
  streakGlow = "0 0 12px rgba(0,255,170,0.7)";
}


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
    if (isValid) {
  setFlash("good");
} else {
  setFlash("bad");
}

setTimeout(() => setFlash("none"), 300);
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
	animation: flash === "bad" ? "shake 0.25s" : "none",
      }}
    >
    {/* 🔥 FLASH */}
    {flash !== "none" && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            flash === "bad"
              ? "rgba(255, 0, 0, 0.15)"
              : "rgba(0, 255, 170, 0.15)",
          pointerEvents: "none",
          animation: "fadeFlash 0.3s ease",
          zIndex: 999,

      transform: flash === "bad" ? "scale(1.01)" : "scale(1)",
      transition: "all 0.1s ease",
        }}
      />
    )}

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


<p
  style={{
    textAlign: "center",
    marginTop: 10,
    color: streakColor,
    textShadow: streakGlow,
    fontWeight: 600,
    letterSpacing: 1,
    transition: "all 0.2s ease",
  }}
>
  🔥 {streak} day{streak !== 1 ? "s" : ""} streak
</p>


<p style={{ textAlign: "center", marginTop: 5, color: "#aaa" }}>
  Today: {todayDiscipline}%
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

<div style={{ position: "relative" }}>
  
  {/* 🔒 LOCK (endast om inte pro) */}
  {!isPro && (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backdropFilter: "blur(6px)",
        background: "rgba(0,0,0,0.4)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <p style={{ marginBottom: 10 }}>
        Unlock full stats
      </p>

      <button
        onClick={async () => {
          const res = await fetch("/api/checkout", {
            method: "POST",
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
            }),
          });

          const data = await res.json();
          window.location.href = data.url;
        }}
        style={{
          background: "#00ffaa",
          color: "#000",
          padding: "10px 16px",
          borderRadius: 10,
          border: "none",
        }}
      >
        Upgrade
      </button>
    </div>

  )}

{/* GRAPH */}
<div style={{ position: "relative" }}>

  {/* 🔒 LOCK */}
  {!isPro && (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backdropFilter: "blur(6px)",
        background: "rgba(0,0,0,0.4)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <p style={{ marginBottom: 10 }}>
        Unlock full stats
      </p>

      <button
        onClick={async () => {
          const res = await fetch("/api/checkout", {
            method: "POST",
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
            }),
          });

          const data = await res.json();
          window.location.href = data.url;
        }}
        style={{
          background: "#00ffaa",
          color: "#000",
          padding: "10px 16px",
          borderRadius: 10,
          border: "none",
        }}
      >
        Upgrade
      </button>
    </div>
  )}

  {/* 📊 GRAF */}
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

        const data = graphData;

        const pnls = data.map((d) => d.pnl);

        const max = Math.max(...pnls, 1);
        const min = Math.min(...pnls, 0);
        const range = max - min || 1;

        const padding = range * 0.3;
        const adjMin = min - padding;
        const adjMax = max + padding;
        const adjRange = adjMax - adjMin;

        const total = data.length;

        let blue = "";
        let green = "";

        data.forEach((d, i) => {
          const x = total === 1 ? 50 : (i / (total - 1)) * 100;

          const yBlue = 100 - d.discipline;
          const yGreen =
            100 - ((d.pnl - adjMin) / adjRange) * 100;

          blue += i === 0 ? `M ${x},${yBlue}` : ` L ${x},${yBlue}`;
          green += i === 0 ? `M ${x},${yGreen}` : ` L ${x},${yGreen}`;
        });

        const area = blue + ` L 100,100 L 0,100 Z`;

        return (
          <>
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
                  "drop-shadow(0 0 12px #3b82f6) drop-shadow(0 0 20px rgba(59,130,246,0.4))",
              }}
            />

            <path d={area} fill="url(#g)" />

            <path
              d={green}
              fill="none"
              stroke="#00ffaa"
              strokeWidth="1"
              opacity="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </>
        );
      })()}
    </svg>
  </div>

</div>

{/* CHECKLIST */}
<div style={{ display: "flex", gap: 10, marginTop: 20 }}>
  {(["level", "confirmation", "rr"] as ChecklistKey[]).map(
    (key) => {
      const active = checklist[key];

      return (
        <div
          key={key}
          onClick={() =>
            setChecklist({
              ...checklist,
              [key]: !active,
            })
          }
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            border: "1px solid",
            borderColor: active ? "#00ffaa" : "#1f2937",
            background: active
              ? "rgba(0,255,170,0.12)"
              : "rgba(255,255,255,0.02)",
            color: active ? "#00ffaa" : "#888",
            textAlign: "center",
            cursor: "pointer",
            fontWeight: 600,
            letterSpacing: 1,
            transition: "all 0.15s ease",
            boxShadow: active
              ? "0 0 10px rgba(0,255,170,0.2)"
              : "none",
            transform: active ? "scale(1.03)" : "scale(1)",
          }}
        >
          {key.toUpperCase()}
        </div>
      );
    }
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

    // 🔥 glow när valid
    boxShadow: isValid
      ? "0 0 12px rgba(0,255,170,0.6)"
      : "none",

    // 🔥 liten pulse när valid
    transform: isValid ? "scale(1.03)" : "scale(1)",
    transition: "all 0.15s ease",
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