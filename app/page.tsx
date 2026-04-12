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

  // load/save
  useEffect(() => {
    const saved = localStorage.getItem("trades_" + todayKey);
    if (saved) setTrades(JSON.parse(saved));
  }, [todayKey]);

  useEffect(() => {
    localStorage.setItem("trades_" + todayKey, JSON.stringify(trades));
  }, [trades, todayKey]);

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  // stats
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

  // notifications (safe)
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // goal + loss logic
  useEffect(() => {
    if (stats.totalPnL >= dailyGoal && !goalHit) {
      new Notification("🎯 Goal reached – you're done!");
      setLocked(true);
      setGoalHit(true);
      setFlash("green");
      setTimeout(() => setFlash(""), 1000);
    }

    if (stats.totalPnL <= dailyLossLimit && !lossHit) {
      new Notification("🛑 Loss limit hit – stop.");
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
        new Notification("⚠️ Invalid trade");
      }

      setTimeout(() => setFlash(""), 600);

      setTrades((prev) => [...prev, newTrade]);
      setPnl("");
      setChecklist({ level: false, confirmation: false, rr: false });
      setWaiting(false);
    }, 600);
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

  const discipline = trades.length
    ? Math.round(
        (trades.filter(t => t.valid).length / trades.length) * 100
      )
    : 0;

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        background: "#0b0f14",
        color: "#e6edf3",
        minHeight: "100vh",
      }}
    >
      <h1>📈 Trading OS</h1>

      {/* flash */}
      {flash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              flash === "green"
                ? "rgba(0,255,150,0.08)"
                : "rgba(255,0,0,0.08)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* PnL */}
      <h2 style={{ fontSize: 36 }}>${stats.totalPnL}</h2>

      {/* GOAL + LOSS (FIXED) */}
      <div style={{ display: "flex", gap: 20 }}>
        <div>
          <p>🎯 Goal</p>
          <input
            type="number"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
          />
        </div>

        <div>
          <p>🛑 Loss</p>
          <input
            type="number"
            value={dailyLossLimit}
            onChange={(e) =>
              setDailyLossLimit(Number(e.target.value))
            }
          />
        </div>
      </div>

      <p>🔥 Streak: {streak}</p>
      <p>🎯 Discipline: {discipline}%</p>
      <p>Winrate: {stats.winrate}%</p>

      {locked && <p style={{ color: "red" }}>🚫 Locked</p>}

      {/* input */}
      <div style={{ marginTop: 10 }}>
        <input
          type="number"
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          placeholder="PnL"
        />
        <button onClick={handleAddTrade} disabled={locked || waiting}>
          {waiting ? "..." : "Add"}
        </button>
      </div>

      {/* checklist */}
      <div style={{ marginTop: 10 }}>
        <label>
          <input
            type="checkbox"
            checked={checklist.level}
            onChange={(e) =>
              setChecklist({
                ...checklist,
                level: e.target.checked,
              })
            }
          />
          Level
        </label>

        <label>
          <input
            type="checkbox"
            checked={checklist.confirmation}
            onChange={(e) =>
              setChecklist({
                ...checklist,
                confirmation: e.target.checked,
              })
            }
          />
          Confirm
        </label>

        <label>
          <input
            type="checkbox"
            checked={checklist.rr}
            onChange={(e) =>
              setChecklist({
                ...checklist,
                rr: e.target.checked,
              })
            }
          />
          RR
        </label>
      </div>

      {/* chart */}
      <div style={{ height: 250, marginTop: 20 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <XAxis dataKey="trade" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#00ffaa"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <button onClick={resetDay} style={{ marginTop: 20 }}>
        Reset Day
      </button>
    </div>
  );
}