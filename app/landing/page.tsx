export default function Landing() {
  return (
    <div style={{
      background: "#020617",
      color: "#fff",
      minHeight: "100vh",
      padding: 20,
      textAlign: "center"
    }}>
      
      <h1 style={{
        fontSize: 42,
        marginBottom: 20,
        color: "#00ffaa"
      }}>
        Trading Discipline
      </h1>

      <p style={{
        fontSize: 20,
        color: "#aaa",
        marginBottom: 30
      }}>
        Most traders don’t lose money because of strategy.  
        <br />
        They lose because they break their rules.
      </p>

      <a href="/app" style={{
        display: "inline-block",
        padding: "14px 24px",
        background: "#00ffaa",
        color: "#000",
        borderRadius: 8,
        textDecoration: "none",
        fontWeight: "bold"
      }}>
        Open App
      </a>

      <div style={{ marginTop: 80 }}>
        <p>✔ Track discipline</p>
        <p>✔ Build streaks</p>
        <p>✔ Stop breaking your rules</p>
      </div>

      <div style={{
        marginTop: 80,
        background: "#111827",
        padding: 30,
        borderRadius: 12
      }}>
        <h2>Simple pricing</h2>
        <h1 style={{ color: "#00ffaa" }}>79 kr / month</h1>
        <p style={{ color: "#aaa" }}>
          Unlimited history • Full tracking
        </p>
      </div>

    </div>
  );
}