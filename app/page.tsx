return (
  <div style={{
    padding: 20,
    fontFamily: "Inter, Arial",
    background: "#0b0f14",
    color: "#e6edf3",
    minHeight: "100vh"
  }}>
    <h1 style={{ marginBottom: 20 }}>📈 Trading OS</h1>

    {/* DASHBOARD CARDS */}
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>

      {/* PNL */}
      <div style={{
        background: "#111827",
        padding: 20,
        borderRadius: 12,
        minWidth: 140
      }}>
        <p style={{ opacity: 0.6 }}>PnL</p>
        <h1 style={{
          fontSize: 32,
          color: stats.totalPnL >= 0 ? "#00ffaa" : "#ff4d4f"
        }}>
          ${stats.totalPnL}
        </h1>
      </div>

      {/* GOAL */}
      <div style={{ background: "#111827", padding: 20, borderRadius: 12 }}>
        <p style={{ opacity: 0.6 }}>🎯 Goal</p>
        <input
          type="number"
          value={dailyGoal}
          onChange={(e) => setDailyGoal(Number(e.target.value))}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #222",
            background: "#0f172a",
            color: "#fff",
            width: 80
          }}
        />
      </div>

      {/* LOSS */}
      <div style={{ background: "#111827", padding: 20, borderRadius: 12 }}>
        <p style={{ opacity: 0.6 }}>🛑 Loss</p>
        <input
          type="number"
          value={dailyLossLimit}
          onChange={(e) => setDailyLossLimit(Number(e.target.value))}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #222",
            background: "#0f172a",
            color: "#fff",
            width: 80
          }}
        />
      </div>

      {/* STREAK */}
      <div style={{ background: "#111827", padding: 20, borderRadius: 12 }}>
        <p style={{ opacity: 0.6 }}>🔥 Streak</p>
        <h2>{streak}</h2>
      </div>
    </div>

    {/* STATS */}
    <div style={{ marginBottom: 20 }}>
      <p>🎯 Discipline: {discipline}%</p>
      <p>Winrate: {stats.winrate}%</p>
      {locked && <p style={{ color: "#ff4d4f" }}>🚫 Locked</p>}
    </div>

    {/* TRADE INPUT */}
    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
      <input
        type="number"
        value={pnl}
        onChange={(e) => setPnl(e.target.value)}
        placeholder="PnL"
        style={{
          padding: 12,
          borderRadius: 8,
          border: "1px solid #222",
          background: "#0f172a",
          color: "#fff"
        }}
      />

      <button
        onClick={handleAddTrade}
        disabled={locked || waiting || !isValid}
        style={{
          padding: "12px 20px",
          background: isValid ? "#00ffaa" : "#333",
          color: "#000",
          border: "none",
          borderRadius: 8,
          cursor: isValid ? "pointer" : "not-allowed",
          fontWeight: "bold"
        }}
      >
        {waiting ? "..." : "Add Trade"}
      </button>
    </div>

    {/* CHECKLIST */}
    <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
      <label><input type="checkbox" checked={checklist.level} onChange={(e)=>setChecklist({...checklist,level:e.target.checked})}/> Level</label>
      <label><input type="checkbox" checked={checklist.confirmation} onChange={(e)=>setChecklist({...checklist,confirmation:e.target.checked})}/> Confirm</label>
      <label><input type="checkbox" checked={checklist.rr} onChange={(e)=>setChecklist({...checklist,rr:e.target.checked})}/> RR</label>
    </div>

    {/* VALID STATUS */}
    <p style={{
      fontWeight: "bold",
      color: isValid ? "#00ffaa" : "#ff4d4f",
      marginBottom: 20
    }}>
      {isValid ? "✅ VALID TRADE" : "❌ INVALID TRADE"}
    </p>

    {/* CHART */}
    <div style={{
      background: "#111827",
      padding: 20,
      borderRadius: 12
    }}>
      <h3 style={{ marginBottom: 10 }}>📈 Equity Curve</h3>

      <div style={{ height: 250 }}>
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
    </div>

    <button
      onClick={resetDay}
      style={{
        marginTop: 20,
        padding: 10,
        background: "#222",
        color: "#fff",
        border: "none",
        borderRadius: 8
      }}
    >
      Reset Day
    </button>
  </div>
);