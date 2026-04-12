"use client";

import { useMemo, useState } from "react";

export default function Page() {
  const [trades, setTrades] = useState<{ pnl: number; valid: boolean }[]>([]);
  const [pnl, setPnl] = useState("");

  const [checklist, setChecklist] = useState({
    level: false,
    confirmation: false,
    rr: false,
  });

  const [streak, setStreak] = useState(0);

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  const data = useMemo(() => {
    let pnlRunning = 0;
    let validCount = 0;

    return trades.map((t, i) => {
      pnlRunning += t.pnl;
      if (t.valid) validCount++;

      const discipline = Math.round((validCount / (i + 1)) * 100);

      return {
        trade: i + 1,
        pnl: pnlRunning,
        discipline,
      };
    });
  }, [trades]);

  const stats = useMemo(() => {
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

    const validCount = trades.filter((t) => t.valid).length;

    const discipline =
      trades.length > 0
        ? Math.round((validCount / trades.length) * 100)
        : 0;

    return { totalPnL, discipline };
  }, [trades]);

  const handleAddTrade = () => {
    if (!pnl) return;

    const value = Number(pnl.replace(",", "."));
    if (isNaN(value)) return;

    setTrades((prev) => [...prev, { pnl: value, valid: isValid }]);

    if (isValid) setStreak((s) => s + 1);
    else setStreak(0);

    setPnl("");
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

      <h2 style={{ textAlign: "center", color: isValid ? "#00ffaa" : "#ff4d4f" }}>
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
        Discipline: {stats.discipline}% | 🔥 {streak}
      </p>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 8 }}>
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

      {/* GRAPH */}
      <div style={{ marginTop: 30 }}>
        <svg width="100%" height="200">
          {data.map((d, i) => {
            if (i === 0) return null;

            const prev = data[i - 1];

            const x1 = ((i - 1) / data.length) * 100;
            const x2 = (i / data.length) * 100;

            const y1 = 100 - prev.pnl / 10;
            const y2 = 100 - d.pnl / 10;

            const d1 = 100 - prev.discipline;
            const d2 = 100 - d.discipline;

            return (
              <g key={i}>
                {/* PnL */}
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="#00ffaa"
                  strokeWidth="2"
                />
                {/* Discipline */}
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
          })}
        </svg>
      </div>

      {/* PNL */}
      <p style={{ textAlign: "center", marginTop: 10 }}>
        PnL: ${stats.totalPnL}
      </p>
    </div>
  );
}