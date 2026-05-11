"use client";

import { useState } from "react";
import styles from "./EntryList.module.css";

const MAX_IMAGES = 8;
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

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

function parseImageUrls(value) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read uploaded file."));
    reader.readAsDataURL(file);
  });
}

export default function Memories({
  initialEntries,
  enableImages = false,
  enableImageUpload = false,
  isAdmin = false,
  showForm = true,
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [author, setAuthor] = useState("");
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [memory, setMemory] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");
  const [moderationError, setModerationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingEntryId, setUpdatingEntryId] = useState("");

  async function updateModeration(id, patch) {
    setModerationError("");
    setUpdatingEntryId(id);
    try {
      const res = await fetch(`/api/admin/moderation/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setModerationError(data.error ?? "Could not update memory.");
        return;
      }
      const updated = await res.json();
      setEntries((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
    } finally {
      setUpdatingEntryId("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!author.trim() || !memoryDate || !memory.trim()) {
      setError("Please fill in author, date, and memory.");
      return;
    }
    setSubmitting(true);
    try {
      const parsedUrls = enableImages ? parseImageUrls(imageUrls) : [];
      let uploadedImageData = [];

      if (enableImages && enableImageUpload && uploadedFiles.length > 0) {
        const oversized = uploadedFiles.find((file) => file.size > MAX_UPLOAD_FILE_SIZE);
        if (oversized) {
          setError(`Uploaded file "${oversized.name}" exceeds the 5MB limit.`);
          return;
        }
        uploadedImageData = await Promise.all(uploadedFiles.map((file) => fileToDataUrl(file)));
      }

      const images = [...parsedUrls, ...uploadedImageData].slice(0, MAX_IMAGES);
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: author.trim(),
          memoryDate,
          memory: memory.trim(),
          images,
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
      setImageUrls("");
      setUploadedFiles([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>📖 Memories</h2>

      {showForm && (
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
        {enableImages && (
          <textarea
            className={styles.textarea}
            placeholder="Optional image URLs (one per line or comma-separated)"
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            rows={2}
            aria-label="Memory image URLs"
          />
        )}
        {enableImages && enableImageUpload && (
          <input
            className={styles.input}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setUploadedFiles(Array.from(e.target.files ?? []).slice(0, MAX_IMAGES))}
            aria-label="Upload memory images"
          />
        )}
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.submitBtn} type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Share memory"}
        </button>
        </form>
      )}

      {entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.item}>
              <strong className={styles.itemName}>{entry.author ?? entry.name}</strong>
              <p className={styles.itemText}>{entry.memory}</p>
              {enableImages && Array.isArray(entry.images) && entry.images.length > 0 && (
                <div className={styles.itemImages}>
                  {entry.images.map((image, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${entry.id}-image-${index}`}
                      className={styles.itemImage}
                      src={image}
                      alt={`Memory by ${entry.author ?? entry.name}`}
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              <time
                className={styles.itemDate}
                dateTime={entry.memoryDate ?? entry.date?.slice(0, 10)}
              >
                {formatMemoryDate(entry.memoryDate ?? entry.date)}
              </time>
              {isAdmin && (
                <div className={styles.adminButtons}>
                  <button
                    className={styles.submitBtn}
                    type="button"
                    disabled={updatingEntryId === entry.id}
                    onClick={() => updateModeration(entry.id, { visible: !entry.visible })}
                  >
                    {entry.visible ? "Hide" : "Show"}
                  </button>
                  <button
                    className={styles.submitBtn}
                    type="button"
                    disabled={updatingEntryId === entry.id}
                    onClick={() =>
                      updateModeration(entry.id, { showOnTimeline: !entry.showOnTimeline })
                    }
                  >
                    {entry.showOnTimeline ? "Remove from timeline" : "Show on timeline"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {moderationError && <p className={styles.error}>{moderationError}</p>}
    </section>
  );
}
