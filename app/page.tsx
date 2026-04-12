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

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  const stats = useMemo(() => {
    let running = 0;
    const equity: number[] = [];

    let total = 0;

    trades.forEach((t) => {
      total += t.pnl;
      running += t.pnl;
      equity.push(running);
    });

    const validCount = trades.filter((t) => t.valid).length;

    const discipline =
      trades.length > 0
        ? Math.round((validCount / trades.length) * 100)
        : 0;

    return { totalPnL: total, equity, discipline };
  }, [trades]);

  const handleAddTrade = () => {
    if (!pnl || !isValid) return;

    const value = parseFloat(pnl.replace(",", "."));
    if (isNaN(value)) return;

    setTrades((prev) => [...prev, { pnl: value, valid: isValid }]);
    setPnl("");
  };

  return (
    <div
      style={{
        padding: 16,
        fontFamily: "Arial",
        background: "#020617",
        color: "#e6edf3",
        minHeight: "100vh",
        maxWidth: 500,
        margin: "0 auto",
      }}
    >
      {/* TITLE */}
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        Trading Discipline
      </h1>

      {/* STATUS */}
      <div
        style={{
          background: "#111827",
          padding: 16,
          borderRadius: 10,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        <h2 style={{ color: isValid ? "#00ffaa" : "#ff4d4f" }}>
          {isValid ? "VALID SETUP" : "INVALID SETUP"}
        </h2>
      </div>

      {/* CHECKLIST */}
      <div
        style={{
          background: "#111827",
          padding: 16,
          borderRadius: 10,
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={checklist.level}
            onChange={(e) =>
              setChecklist({ ...checklist, level: e.target.checked })
            }
          />{" "}
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
          />{" "}
          Confirmation
        </label>

        <label>
          <input
            type="checkbox"
            checked={checklist.rr}
            onChange={(e) =>
              setChecklist({ ...checklist, rr: e.target.checked })
            }
          />{" "}
          RR
        </label>
      </div>

      {/* FEEDBACK */}
      <p
        style={{
          textAlign: "center",
          marginBottom: 16,
          color: isValid ? "#00ffaa" : "#ff4d4f",
        }}
      >
        {isValid
          ? "You are following your system"
          : "You are about to break your rules"}
      </p>

      {/* DISCIPLINE */}
      <div
        style={{
          background: "#111827",
          padding: 16,
          borderRadius: 10,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
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
            color: "#fff",
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
            opacity: isValid ? 1 : 0.4,
          }}
        >
          Add
        </button>
      </div>

      {/* PNL */}
      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          opacity: 0.6,
        }}
      >
        PnL: ${stats.totalPnL}
      </p>
    </div>
  );
}