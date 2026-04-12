"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

export default function Page() {
  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");

  const [checklist, setChecklist] = useState({
    level: false,
    confirmation: false,
    rr: false,
  });

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  const stats = useMemo(() => {
    let running = 0;
    const equity: number[] = [];

    const totalPnL = trades.reduce((sum, t) => {
      running += t.pnl;
      equity.push(running);
      return sum + t.pnl;
    }, 0);

    const validCount = trades.filter(t => t.valid).length;
    const discipline = trades.length
      ? Math.round((validCount / trades.length) * 100)
      : 0;

    return { totalPnL, equity, discipline };
  }, [trades]);

  const handleAddTrade = () => {
    if (!pnl || !isValid) return;

    const value = parseFloat(pnl.replace(",", "."));

    if (isNaN(value)) return;

    setTrades(prev => [...prev, { pnl: value, valid: isValid }]);
    setPnl("");
  };

  const chartData = stats.equity.map((v, i) => ({
    trade: i + 1,
    equity: v,
  }));

  const card = {
    background: "#111827",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #222",
    marginBottom: 16,
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
        fontSize: 28,
        marginBottom: 20
      }}>
        Trading Discipline
      </h1>

      {/* STATUS */}
      <div style={{ ...card, textAlign: "center" }}>
        <h2 style={{
          color: isValid ? "#00ffaa" : "#ff4d4f"
        }}>
          {isValid ? "VALID SETUP" : "INVALID SETUP"}
        </h2>
      </div>

      {/* CHECKLIST */}
      <div style={{ ...card }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label>
            <input
              type="checkbox"
              checked={checklist.level}
              onChange={(e) =>
                setChecklist({ ...checklist, level: e.target.checked })
              }
            /> Level
          </label>

          <label>
            <input
              type="checkbox"
              checked={checklist.confirmation}
              onChange={(e) =>
                setChecklist({ ...checklist, confirmation: e.target.checked })
              }
            /> Confirmation
          </label>

          <label>
            <input
              type="checkbox"
              checked={checklist.rr}
              onChange={(e) =>
                setChecklist({ ...checklist, rr: e.target.checked })
              }
            /> RR
          </label>
        </div>
      </div>

      {/* FEEDBACK */}
      <p style={{
        textAlign: "center",
        marginBottom: 16,
        color: isValid ? "#00ffaa" : "#ff4d4f"
      }}>
        {isValid
          ? "You are following your system"
          : "You are about to break your rules"}
      </p>

      {/* DISCIPLINE */}
      <div style={{ ...card, textAlign: "center" }}>
        <p>Discipline</p>
        <h2>{stats.discipline}%</h2>
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          inputMode="decimal"
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          placeholder="PnL"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #222",
            background: "#0f172a",
            color: "#fff"
          }}
        />

        <button
          onClick={handleAddTrade}
          disabled={!isValid}
          style={{
            padding: "10px 14px",
            background: isValid ? "#00ffaa" : "#333",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            opacity: isValid ? 1 : 0.4
          }}
        >
          Add
        </button>
      </div>

      {/* PNL */}
      <p style={{
        textAlign: "center",
        marginTop: 20,
        opacity: 0.6
      }}>
        PnL: ${stats.totalPnL}
      </p>

      {/* CHART */}
      <div style={{ height: 200, marginTop: 10 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="trade" />
            <YAxis />
            <Tooltip />
            <Line dataKey="equity" stroke="#00ffaa" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}