"use client";
import { useMemo, useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TradingApp() {
  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");
  const [dailyGoal, setDailyGoal] = useState(200);

  const [checklist, setChecklist] = useState({
    level: false,
    confirmation: false,
    rr: false,
  });

  const [waiting, setWaiting] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("trades");
    if (saved) setTrades(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("trades", JSON.stringify(trades));
  }, [trades]);

  const isValid = checklist.level && checklist.confirmation && checklist.rr;

  const stats = useMemo(() => {
    let running = 0;
    const equity: number[] = [];

    const totalPnL = trades.reduce((a, t) => {
      running += t.pnl;
      equity.push(running);
      return a + t.pnl;
    }, 0);

    const wins = trades.filter(t => t.pnl > 0).length;
    const losses = trades.filter(t => t.pnl <= 0).length;
    const winrate = trades.length ? Math.round((wins / trades.length) * 100) : 0;

    return { totalPnL, equity, winrate, wins, losses };
  }, [trades]);

  // Notifications
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (stats.totalPnL >= dailyGoal) {
      new Notification("🎯 Goal reached! Stop trading.");
      setLocked(true);
    }
  }, [stats.totalPnL]);

  const handleAddTrade = () => {
    if (!pnl || locked) return;

    setWaiting(true);

    setTimeout(() => {
      const newTrade = {
        pnl: parseFloat(pnl),
        valid: isValid,
        time: new Date().getHours(),
      };

      if (!isValid) {
        new Notification("⚠️ This trade is INVALID");
      }

      setTrades((prev) => [...prev, newTrade]);
      setPnl("");
      setChecklist({ level: false, confirmation: false, rr: false });
      setWaiting(false);
    }, 2000);
  };

  const chartData = stats.equity.map((v, i) => ({
    trade: i + 1,
    equity: v,
  }));

  const discipline = trades.length
    ? Math.round((trades.filter(t => t.valid).length / trades.length) * 100)
    : 0;

  return (
    <div style={{ padding: 20, fontFamily: "Arial", background: "#111", color: "#eee", minHeight: "100vh" }}>
      <h1>📈 Trading Dashboard</h1>

      {locked && <p style={{ color: "red" }}>🚫 Trading locked</p>}

      <h2>🎯 Daily Goal</h2>
      <input value={dailyGoal} onChange={(e)=>setDailyGoal(Number(e.target.value))} />
      <p>Current: ${stats.totalPnL}</p>

      <h2>Checklist</h2>
      <label><input type="checkbox" checked={checklist.level} onChange={(e)=>setChecklist({...checklist,level:e.target.checked})}/> Level</label><br/>
      <label><input type="checkbox" checked={checklist.confirmation} onChange={(e)=>setChecklist({...checklist,confirmation:e.target.checked})}/> Confirmation</label><br/>
      <label><input type="checkbox" checked={checklist.rr} onChange={(e)=>setChecklist({...checklist,rr:e.target.checked})}/> RR ≥ 1:2</label>

      <h3>{isValid ? "✅ VALID" : "❌ INVALID"}</h3>

      <input value={pnl} onChange={(e)=>setPnl(e.target.value)} placeholder="PnL" />
      <button onClick={handleAddTrade} disabled={waiting || locked}>
        {waiting ? "Thinking..." : "Add Trade"}
      </button>

      <hr />

      <h2>📊 Stats</h2>
      <p>Total: ${stats.totalPnL}</p>
      <p>Winrate: {stats.winrate}%</p>

      <h2>🎯 Discipline</h2>
      <p>{discipline}% VALID trades</p>

      <h2>📈 Equity Curve</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="trade" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="equity" stroke="#00ffff" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2>Trades</h2>
      {trades.map((t,i)=>(
        <div key={i}>#{i+1} ${t.pnl} {t.valid?"VALID":"INVALID"}</div>
      ))}
    </div>
  );
}
