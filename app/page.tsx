"use client";

import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const today = new Date().toISOString().slice(0, 10);

  const [trades, setTrades] = useState<{ pnl: number; valid: boolean }[]>([]);
  const [pnl, setPnl] = useState("");

  const [streak, setStreak] = useState(0);
  const [lastDate, setLastDate] = useState("");

  const [checklist, setChecklist] = useState({
    level: false,
    confirmation: false,
    rr: false,
  });

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  // LOAD SAVED DATA
  useEffect(() => {
    const savedTrades = localStorage.getItem("trades_" + today);
    const savedStreak = localStorage.getItem("streak");
    const savedDate = localStorage.getItem("lastDate");

    if (savedTrades) setTrades(JSON.parse(savedTrades));
    if (savedStreak) setStreak(Number(savedStreak));
    if (savedDate) setLastDate(savedDate);
  }, [today]);

  // SAVE TRADES
  useEffect(() => {
    localStorage.setItem("trades_" + today, JSON.stringify(trades));
  }, [trades, today]);

  // STATS
  const stats = useMemo(() => {
    let total = 0;
    let validCount = 0;

    trades.forEach((t) => {
      total += t.pnl;
      if (t.valid) validCount++;
    });

    const discipline =
      trades.length > 0
        ? Math.round((validCount / trades.length) * 100)
        : 0;

    return { totalPnL: total, discipline };
  }, [trades]);

  // CHECK IF DAY IS DISCIPLINED
  const isDisciplinedDay =
    trades.length >= 3 && stats.discipline >= 80;

  // HANDLE TRADE
  const handleAddTrade = () => {
    if (!pnl) return;

    const value = Number(pnl.replace(",", "."));
    if (isNaN(value)) return;

    const newTrades = [...trades, { pnl: value, valid: isValid }];
    setTrades(newTrades);

    setPnl("");

    // AFTER adding trade → check discipline
    const validCount = newTrades.filter(t => t.valid).length;
    const discipline = Math.round((validCount / newTrades.length) * 100);

    const disciplined =
      newTrades.length >= 3 && discipline >= 80;

    if (disciplined) {
      // NEW DAY?
      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.toISOString().slice(0, 10);

        if (lastDate === y) {
          setStreak((s) => {
            const newStreak = s + 1;
            localStorage.setItem("streak", String(newStreak));
            return newStreak;
          });
        } else {
          setStreak(1);
          localStorage.setItem("streak", "1");
        }

        setLastDate(today);
        localStorage.setItem("lastDate", today);
      }
    } else {
      // broke discipline
      setStreak(0);
      localStorage.setItem("streak", "0");
    }
  };

  return (
    <div style={{
      padding: 16,
      fontFamily: "Arial",
      background: "#020617",
      color: "#e6edf3",
      minHeight: "100vh",
      maxWidth: 500,
      margin: "0 auto"
    }}>
      {/* TITLE */}
      <h1 style={{
        textAlign: "center",
        fontSize: 36,
        marginBottom: 20,
        background: "linear-gradient(90deg,#00ffaa,#00cc88)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Trading Discipline
      </h1>

      {/* STATUS */}
      <h2 style={{
        textAlign: "center",
        color: isValid ? "#00ffaa" : "#ff4d4f"
      }}>
        {isValid ? "VALID SETUP" : "INVALID SETUP"}
      </h2>

      {/* CHECKLIST */}
      <div style={{ display: "flex", justifyContent: "space-between", margin: 16 }}>
        <label><input type="checkbox" checked={checklist.level} onChange={e=>setChecklist({...checklist,level:e.target.checked})}/> Level</label>
        <label><input type="checkbox" checked={checklist.confirmation} onChange={e=>setChecklist({...checklist,confirmation:e.target.checked})}/> Confirmation</label>
        <label><input type="checkbox" checked={checklist.rr} onChange={e=>setChecklist({...checklist,rr:e.target.checked})}/> RR</label>
      </div>

      {/* DISCIPLINE */}
      <p style={{ textAlign: "center" }}>
        Discipline: {stats.discipline}%
      </p>

      {/* STREAK */}
      <div style={{
        textAlign: "center",
        marginTop: 10
      }}>
        <p style={{ opacity: 0.6 }}>🔥 Discipline Streak</p>
        <h2>{streak} days</h2>
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          type="text"
          inputMode="numeric"
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          placeholder="+100 / -50"
          style={{ flex: 1, padding: 10 }}
        />
        <button
          onClick={handleAddTrade}
          style={{
            background: isValid ? "#00ffaa" : "#ff4d4f",
            padding: 10
          }}
        >
          {isValid ? "Log" : "Break"}
        </button>
      </div>

      {/* PNL */}
      <p style={{ textAlign: "center", marginTop: 20 }}>
        PnL: ${stats.totalPnL}
      </p>
    </div>
  );
}