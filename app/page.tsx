"use client";
import { useMemo, useState, useEffect } from "react";

export default function TradingApp() {
  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");
  const [setup, setSetup] = useState("breakout");

  const [checklist, setChecklist] = useState({
    level: false,
    confirmation: false,
    rr: false,
  });

  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("trades");
    if (saved) setTrades(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("trades", JSON.stringify(trades));
  }, [trades]);

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  const handleAddTrade = () => {
    if (!pnl) return;

    setWaiting(true);

    setTimeout(() => {
      const newTrade = {
        pnl: parseFloat(pnl),
        setup,
        valid: isValid,
        time: new Date().getHours(),
        source: "manual",
      };

      setTrades((prev) => [...prev, newTrade]);
      setPnl("");
      setChecklist({ level: false, confirmation: false, rr: false });
      setWaiting(false);
    }, 2000);
  };

  const stats = useMemo(() => {
    const totalPnL = trades.reduce((a, t) => a + t.pnl, 0);

    const validTrades = trades.filter((t) => t.valid === true);
    const invalidTrades = trades.filter((t) => t.valid === false);

    const validPnL = validTrades.reduce((a, t) => a + t.pnl, 0);
    const invalidPnL = invalidTrades.reduce((a, t) => a + t.pnl, 0);

    return { totalPnL, validPnL, invalidPnL };
  }, [trades]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Trading System</h1>

      <h2>Checklist</h2>

      <label>
        <input
          type="checkbox"
          checked={checklist.level}
          onChange={(e) =>
            setChecklist({ ...checklist, level: e.target.checked })
          }
        />
        At key level
      </label>
      <br />

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
        Confirmation
      </label>
      <br />

      <label>
        <input
          type="checkbox"
          checked={checklist.rr}
          onChange={(e) =>
            setChecklist({ ...checklist, rr: e.target.checked })
          }
        />
        RR ≥ 1:2
      </label>

      <h3>{isValid ? "VALID" : "INVALID"}</h3>

      <input
        value={pnl}
        onChange={(e) => setPnl(e.target.value)}
        placeholder="PnL"
      />

      <button onClick={handleAddTrade} disabled={waiting}>
        {waiting ? "Thinking..." : "Add Trade"}
      </button>

      <h2>Stats</h2>
      <p>Total: {stats.totalPnL}</p>
      <p>Valid: {stats.validPnL}</p>
      <p>Invalid: {stats.invalidPnL}</p>
    </div>
  );
}