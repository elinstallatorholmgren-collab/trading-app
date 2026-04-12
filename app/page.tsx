"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");

  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState("");

  const [checklist, setChecklist] = useState({
    level: false,
    confirmation: false,
    rr: false,
  });

  const isValid =
    checklist.level && checklist.confirmation && checklist.rr;

  // 🔐 GET USER
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  // 📥 LOAD USER TRADES
  useEffect(() => {
    if (!user) return;

    const loadTrades = async () => {
      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (data) setTrades(data);
    };

    loadTrades();
  }, [user]);

  // ➕ ADD TRADE
  const handleAddTrade = async () => {
    if (!pnl || !user) return;

    const value = Number(pnl.replace(",", "."));
    if (isNaN(value)) return;

    const { error } = await supabase.from("trades").insert([
      {
        pnl: value,
        valid: isValid,
        user_id: user.id,
      },
    ]);

    if (!error) {
      setTrades((prev) => [
        ...prev,
        { pnl: value, valid: isValid },
      ]);
      setPnl("");
    }
  };

  // 🔐 LOGIN
  const handleLogin = async () => {
    await supabase.auth.signInWithOtp({
      email,
    });

    alert("Check your email ✉️");
  };

  // 🔓 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ❌ NOT LOGGED IN
  if (!user) {
    return (
      <div style={{
        padding: 20,
        background: "#020617",
        color: "#fff",
        minHeight: "100vh"
      }}>
        <h1 style={{ textAlign: "center" }}>
          Trading Discipline
        </h1>

        <div style={{
          maxWidth: 300,
          margin: "40px auto",
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}>
          <input
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10 }}
          />

          <button
            onClick={handleLogin}
            style={{
              padding: 10,
              background: "#00ffaa",
              border: "none"
            }}
          >
            Send Magic Link
          </button>
        </div>
      </div>
    );
  }

  // ✅ LOGGED IN
  return (
    <div style={{
      padding: 16,
      background: "#020617",
      color: "#fff",
      minHeight: "100vh"
    }}>
      <h1 style={{ textAlign: "center" }}>
        Trading Discipline
      </h1>

      <p style={{ textAlign: "center", opacity: 0.6 }}>
        Logged in as: {user.email}
      </p>

      <button onClick={handleLogout}>
        Logout
      </button>

      <div style={{ marginTop: 20 }}>
        <label><input type="checkbox" onChange={e=>setChecklist({...checklist,level:e.target.checked})}/> Level</label>
        <label><input type="checkbox" onChange={e=>setChecklist({...checklist,confirmation:e.target.checked})}/> Confirmation</label>
        <label><input type="checkbox" onChange={e=>setChecklist({...checklist,rr:e.target.checked})}/> RR</label>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
          placeholder="+100 / -50"
        />

        <button onClick={handleAddTrade}>
          Add Trade
        </button>
      </div>

      <p style={{ marginTop: 20 }}>
        Trades: {trades.length}
      </p>
    </div>
  );
}