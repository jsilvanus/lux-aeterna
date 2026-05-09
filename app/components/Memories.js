"use client";

import { useState } from "react";
import styles from "./EntryList.module.css";

export default function Memories({ initialEntries }) {
  const [entries, setEntries] = useState(initialEntries);
  const [name, setName] = useState("");
  const [memory, setMemory] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !memory.trim()) {
      setError("Please fill in your name and memory.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), memory: memory.trim() }),
      });
      if (!res.ok) {
        let errorMessage = "Something went wrong.";
        try {
          const data = await res.json();
          errorMessage = data.error ?? errorMessage;
        } catch {
          // non-JSON error body; keep default message
        }
        setError(errorMessage);
        return;
      }
      const entry = await res.json();
      setEntries((prev) => [...prev, entry]);
      setName("");
      setMemory("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>📖 Memories</h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <input
          className={styles.input}
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          aria-label="Your name"
        />
        <textarea
          className={styles.textarea}
          placeholder="Share a memory…"
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          rows={3}
          maxLength={1000}
          aria-label="Share a memory"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submitBtn} type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Share memory"}
        </button>
      </form>

      {entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.item}>
              <strong className={styles.itemName}>{entry.name}</strong>
              <p className={styles.itemText}>{entry.memory}</p>
              <time className={styles.itemDate} dateTime={entry.date}>
                {new Date(entry.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
