"use client";

import { useState } from "react";
import styles from "./EntryList.module.css";

export default function Condolences({ initialEntries }) {
  const [entries, setEntries] = useState(initialEntries);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !message.trim()) {
      setError("Please fill in your name and message.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/condolences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const entry = await res.json();
      setEntries((prev) => [...prev, entry]);
      setName("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>💌 Condolences</h2>

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
          placeholder="Your message of condolence…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          aria-label="Your message of condolence"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submitBtn} type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send condolence"}
        </button>
      </form>

      {entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.item}>
              <strong className={styles.itemName}>{entry.name}</strong>
              <p className={styles.itemText}>{entry.message}</p>
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
