"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

export default function TradingDisciplineApp() {
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

    const totalPnL = trades.reduce((a, t) => {
      running += t.pnl;
      equity.push(running);
      return a + t.pnl;
    }, 0);

    const validTrades = trades.filter(t => t.valid).length;
    const discipline = trades.length
      ? Math.round((validTrades / trades.length) * 100)
      : 0;

    return { totalPnL, equity, discipline };
  }, [trades]);

  const handleAddTrade = () => {
    if (!pnl || !isValid) return;

    const tradePnL = parseFloat(pnl.replace(",", "."));

    setTrades((prev) => [
      ...prev,
      { pnl: tradePnL, valid: isValid },
    ]);

    setPnl("");
  };

  const chartData = stats.equity.map((v, i) => ({
    trade: i + 1,
    equity: v,
  }));

  const card = {
    background: "linear-gradient(145deg, #111827, #0f172a)",
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.05)"
  };

  return (
    <div style={{
      padding: 20,
      fontFamily: "Arial",
      background: "radial-gradient(circle at top, #0f172a, #020617)",
      color: "#e6edf3",
      minHeight: "100vh"
    }}>
      
      {/* TITLE */}
      <h1 style={{
        textAlign: "center",
        fontSize: 34,
        fontWeight: "bold",
        marginBottom: 20,
        background: "linear-gradient(90deg, #00ffaa, #00cc88)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Trading Discipline
      </h1>

      {/* HERO STATE */}
      <div style={{
        ...card,
        textAlign: "center",
        marginBottom: 20
      }}>
        <h1 style={{
          fontSize: 28,
          color: isValid ? "#00ffaa" : "#ff4d4f"
        }}>
          {isValid ? "VALID SETUP" : "INVALID SETUP"}
        </h1>
      </div>

      {/* CHECKLIST (UP TOP) */}
      <div style={{
        display: "flex",
        gap: 20,
        marginBottom: 10,
        justifyContent: "center"
      }}>
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

      {/* FEEDBACK */}
      <p style={{
        textAlign: "center",
        marginBottom: 20,
        fontWeight: "bold",
        color: isValid ? "#00ffaa" : "#ff4d4f"
      }}>
        {isValid
          ? "You are following your system"
          : "You are about to break your rules"}
      </p>

      {/* DISCIPLINE */}
      <div style={{
        ...card,
        textAlign: "center",
        marginBottom: 20
      }}>
        <p style={{ opacity: 0.6 }}>Discipline</p>
        <h2 style={{
          fontSize: 32,
          color: stats.discipline >= 80 ? "#00ffaa" : "#ff4d4f"
        }}>
          {stats.discipline}%
        </h2>
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="text"
          inputMode="decimal"
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          placeholder="PnL"
          style={{
            flex: 1,
            padding: 12,
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
            padding: "12px 20px",
            background: isValid
              ? "linear-gradient(135deg,#00ffaa,#00cc88)"
              : "#1f2937",
            color: "#000",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: isValid ? "pointer" : "not-allowed",
            opacity: isValid ? 1 : 0.4
          }}
        >
          {isValid ? "Execute Trade" : "Invalid"}
        </button>
      </div>

      {/* PNL (DOWNPLAYED) */}
      <p style={{
        marginTop: 20,
        opacity: 0.5,
        textAlign: "center"
      }}>
        PnL: ${stats.totalPnL}
      </p>

      {/* CHART */}
      <div style={{ height: 250, marginTop: 10 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="trade" />
            <YAxis />
            <Tooltip />
            <Line dataKey="equity" stroke="#00ffaa" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}