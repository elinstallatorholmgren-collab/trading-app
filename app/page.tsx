"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

export default function TradingApp() {
  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");

  const [dailyGoal, setDailyGoal] = useState(200);
  const [dailyLossLimit, setDailyLossLimit] = useState(-200);

  const [checklist, setChecklist] = useState({
    level: false,
    confirmation: false,
    rr: false,
  });

  const [waiting, setWaiting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [flash, setFlash] = useState<"" | "green" | "red">("");
  const [streak, setStreak] = useState(0);

  const [goalHit, setGoalHit] = useState(false);
  const [lossHit, setLossHit] = useState(false);

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const saved = localStorage.getItem("trades_" + todayKey);
    if (saved) setTrades(JSON.parse(saved));
  }, [todayKey]);

  useEffect(() => {
    localStorage.setItem("trades_" + todayKey, JSON.stringify(trades));
  }, [trades, todayKey]);

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  const stats = useMemo(() => {
    let running = 0;
    const equity: number[] = [];

    const totalPnL = trades.reduce((a, t) => {
      running += t.pnl;
      equity.push(running);
      return a + t.pnl;
    }, 0);

    const wins = trades.filter(t => t.pnl > 0).length;
    const winrate = trades.length
      ? Math.round((wins / trades.length) * 100)
      : 0;

    return { totalPnL, equity, winrate };
  }, [trades]);

  // 🎯 PERFECT DAY
  const perfectDay =
    stats.totalPnL > 0 &&
    discipline(trades) >= 80 &&
    !lossHit;

  function discipline(trades: any[]) {
    return trades.length
      ? Math.round(
          (trades.filter(t => t.valid).length / trades.length) * 100
        )
      : 0;
  }

  useEffect(() => {
    if (stats.totalPnL >= dailyGoal && !goalHit) {
      setLocked(true);
      setGoalHit(true);
      setFlash("green");
      setTimeout(() => setFlash(""), 1000);
    }

    if (stats.totalPnL <= dailyLossLimit && !lossHit) {
      setLocked(true);
      setLossHit(true);
      setFlash("red");
      setTimeout(() => setFlash(""), 1000);
    }
  }, [stats.totalPnL, dailyGoal, dailyLossLimit]);

  const handleAddTrade = () => {
    if (!pnl || locked) return;

    setWaiting(true);

    setTimeout(() => {
      const tradePnL = parseFloat(pnl);

      const newTrade = {
        pnl: tradePnL,
        valid: isValid,
        time: new Date().getHours(),
      };

      if (isValid) {
        setFlash("green");
        setStreak((s) => s + 1);
      } else {
        setFlash("red");
        setStreak(0);
      }

      setTimeout(() => setFlash(""), 600);

      setTrades((prev) => [...prev, newTrade]);
      setPnl("");
      setChecklist({ level: false, confirmation: false, rr: false });
      setWaiting(false);
    }, 400);
  };

  const resetDay = () => {
    setTrades([]);
    setLocked(false);
    setStreak(0);
    setGoalHit(false);
    setLossHit(false);
    localStorage.removeItem("trades_" + todayKey);
  };

  const chartData = stats.equity.map((v, i) => ({
    trade: i + 1,
    equity: v,
  }));

  const card = {
    background: "linear-gradient(145deg, #111827, #0f172a)",
    padding: 16,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.05)",
    flex: 1,
    minWidth: 120
  };

  return (
    <div style={{
      padding: 16,
      fontFamily: "Arial",
      background: "radial-gradient(circle at top, #0f172a, #020617)",
      color: "#e6edf3",
      minHeight: "100vh"
    }}>
      <h2 style={{ marginBottom: 10 }}>📈 Trading OS</h2>

      {/* PERFECT DAY */}
      {perfectDay && (
        <div style={{
          background: "linear-gradient(135deg,#00ffaa,#00cc88)",
          padding: 10,
          borderRadius: 10,
          marginBottom: 10,
          color: "#000",
          fontWeight: "bold",
          textAlign: "center"
        }}>
          🏆 PERFECT DAY
        </div>
      )}

      {/* CARDS */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        
        <div style={card}>
          <p>PnL</p>
          <h1 style={{
            fontSize: 32,
            color: stats.totalPnL >= 0 ? "#00ffaa" : "#ff4d4f"
          }}>
            ${stats.totalPnL}
          </h1>
        </div>

        <div style={card}>
          <p>Goal</p>
          <input type="number" value={dailyGoal} onChange={(e)=>setDailyGoal(Number(e.target.value))}/>
        </div>

        <div style={card}>
          <p>Loss</p>
          <input type="number" value={dailyLossLimit} onChange={(e)=>setDailyLossLimit(Number(e.target.value))}/>
        </div>

        <div style={card}>
          <p>🔥</p>
          <h2>{streak}</h2>
        </div>
      </div>

      <p style={{ marginTop: 10 }}>
        🎯 {discipline(trades)}% | 📊 {stats.winrate}%
      </p>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          type="number"
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          placeholder="PnL"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            background: "#0f172a",
            color: "#fff"
          }}
        />

        <button
          onClick={handleAddTrade}
          disabled={locked || waiting || !isValid}
          style={{
            padding: "10px 16px",
            background: isValid ? "#00ffaa" : "#333",
            borderRadius: 8,
            fontWeight: "bold"
          }}
        >
          +
        </button>
      </div>

      {/* CHECKLIST */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <label><input type="checkbox" checked={checklist.level} onChange={(e)=>setChecklist({...checklist,level:e.target.checked})}/> L</label>
        <label><input type="checkbox" checked={checklist.confirmation} onChange={(e)=>setChecklist({...checklist,confirmation:e.target.checked})}/> C</label>
        <label><input type="checkbox" checked={checklist.rr} onChange={(e)=>setChecklist({...checklist,rr:e.target.checked})}/> RR</label>
      </div>

      <p style={{
        color: isValid ? "#00ffaa" : "#ff4d4f",
        marginTop: 6
      }}>
        {isValid ? "VALID" : "INVALID"}
      </p>

      {/* CHART */}
      <div style={{ marginTop: 20, ...card }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="trade" />
            <YAxis />
            <Tooltip />
            <Line dataKey="equity" stroke="#00ffaa" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <button onClick={resetDay} style={{ marginTop: 10 }}>
        Reset
      </button>
    </div>
  );
}