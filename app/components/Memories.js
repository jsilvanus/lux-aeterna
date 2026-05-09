"use client";

import { useState } from "react";
import styles from "./EntryList.module.css";

function formatMemoryDate(value) {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      },
    );
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Memories({ initialEntries }) {
  const [entries, setEntries] = useState(initialEntries);
  const [author, setAuthor] = useState("");
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [memory, setMemory] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!author.trim() || !memoryDate || !memory.trim()) {
      setError("Please fill in author, date, and memory.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: author.trim(),
          memoryDate,
          memory: memory.trim(),
        }),
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
      setAuthor("");
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
          placeholder="Author name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={80}
          aria-label="Author name"
        />
        <input
          className={styles.input}
          type="date"
          value={memoryDate}
          onChange={(e) => setMemoryDate(e.target.value)}
          aria-label="Date of memory"
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
              <strong className={styles.itemName}>{entry.author ?? entry.name}</strong>
              <p className={styles.itemText}>{entry.memory}</p>
              <time
                className={styles.itemDate}
                dateTime={entry.memoryDate ?? entry.date?.slice(0, 10)}
              >
                {formatMemoryDate(entry.memoryDate ?? entry.date)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
