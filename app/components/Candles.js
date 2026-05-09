"use client";

import { useState } from "react";
import styles from "./Candles.module.css";

export default function Candles({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  const [lit, setLit] = useState(false);
  const [loading, setLoading] = useState(false);

  async function lightCandle() {
    if (lit || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/candles", { method: "POST" });
      const data = await res.json();
      setCount(data.count);
      setLit(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>🕯 Candles</h2>
      <p className={styles.countText}>
        {count === 1 ? "1 candle lit" : `${count} candles lit`}
      </p>
      <button
        className={`${styles.button} ${lit ? styles.lit : ""}`}
        onClick={lightCandle}
        disabled={lit || loading}
        aria-label="Light a candle"
      >
        {lit ? "Candle lit 🕯" : loading ? "Lighting…" : "Light a candle"}
      </button>
    </section>
  );
}
