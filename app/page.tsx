"use client";

import { useMemo, useState } from "react";
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

    return { totalPnL, equity };
  }, [trades]);

  const handleAddTrade = () => {
    if (!pnl) return;

    const tradePnL = parseFloat(pnl);

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

  return (
<div style={{
  background: "linear-gradient(145deg, #111827, #0f172a)",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.05)",
  marginBottom: 20
}}>
  <p style={{ opacity: 0.6 }}>PnL</p>
  <h1 style={{
    fontSize: 36,
    color: stats.totalPnL >= 0 ? "#00ffaa" : "#ff4d4f"
  }}>
    ${stats.totalPnL}
  </h1>
</div>
      <h1>📈 Trading OS</h1>

      <h2 style={{
        color: stats.totalPnL >= 0 ? "#00ffaa" : "#ff4d4f"
      }}>
        ${stats.totalPnL}
      </h2>

      <div style={{ marginTop: 10 }}>
        <input
          type="number"
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          placeholder="PnL"
        />
        <button onClick={handleAddTrade}>
          Add Trade
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <label><input type="checkbox" checked={checklist.level} onChange={(e)=>setChecklist({...checklist,level:e.target.checked})}/> Level</label>
        <label><input type="checkbox" checked={checklist.confirmation} onChange={(e)=>setChecklist({...checklist,confirmation:e.target.checked})}/> Confirm</label>
        <label><input type="checkbox" checked={checklist.rr} onChange={(e)=>setChecklist({...checklist,rr:e.target.checked})}/> RR</label>
      </div>

      <p style={{
        color: isValid ? "#00ffaa" : "#ff4d4f"
      }}>
        {isValid ? "VALID" : "INVALID"}
      </p>

      <div style={{ height: 250, marginTop: 20 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="trade" />
            <YAxis />
            <Tooltip />
            <Line dataKey="equity" stroke="#00ffaa" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}