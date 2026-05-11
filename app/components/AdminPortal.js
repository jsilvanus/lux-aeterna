"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./AdminPortal.module.css";

const MAX_IMAGES = 8;
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

function parseImageText(value) {
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

export default function AdminPortal({
  isAdmin,
  loginConfigured,
  imageUploadEnabled,
  initialSettings = { mainImages: [], titleLinks: [] },
  initialTimelineEvents = [],
  initialMemories = [],
  initialCondolences = [],
}) {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState("settings");

  const [settingsError, setSettingsError] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [mainImagesText, setMainImagesText] = useState(initialSettings.mainImages.join("\n"));
  const [linkRows, setLinkRows] = useState(
    initialSettings.titleLinks.length > 0
      ? initialSettings.titleLinks
      : [{ title: "", url: "", active: true }],
  );
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [timelineError, setTimelineError] = useState("");
  const [timelineEvents, setTimelineEvents] = useState(initialTimelineEvents);
  const [timelineForm, setTimelineForm] = useState({
    year: "",
    month: "",
    day: "",
    title: "",
    description: "",
    images: "",
  });

  const [memories, setMemories] = useState(initialMemories);
  const [condolences, setCondolences] = useState(initialCondolences);
  const [moderationError, setModerationError] = useState("");

  const activeLinks = useMemo(() => linkRows.filter((row) => row.active), [linkRows]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error ?? "Login failed.");
      return;
    }
    window.location.reload();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function saveSettings() {
    setSettingsError("");
    setSettingsSaving(true);
    try {
      const parsedImages = parseImageText(mainImagesText);
      let uploadedData = [];
      if (imageUploadEnabled && uploadedFiles.length > 0) {
        const oversized = uploadedFiles.find((file) => file.size > MAX_UPLOAD_FILE_SIZE);
        if (oversized) {
          setSettingsError(`Uploaded file "${oversized.name}" exceeds the 5MB limit.`);
          return;
        }
        uploadedData = await Promise.all(uploadedFiles.map((file) => fileToDataUrl(file)));
      }

      const payload = {
        mainImages: [...parsedImages, ...uploadedData].slice(0, MAX_IMAGES),
        titleLinks: linkRows
          .map((row) => ({
            title: row.title.trim(),
            url: row.url.trim(),
            active: Boolean(row.active),
          }))
          .filter((row) => row.title && row.url),
      };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSettingsError(data.error ?? "Could not save settings.");
        return;
      }
      const updated = await res.json();
      setMainImagesText((updated.mainImages ?? []).join("\n"));
      setLinkRows(
        (updated.titleLinks ?? []).length > 0
          ? updated.titleLinks
          : [{ title: "", url: "", active: true }],
      );
      setUploadedFiles([]);
    } finally {
      setSettingsSaving(false);
    }
  }

  function updateLinkRow(index, patch) {
    setLinkRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function addTimelineEvent(event) {
    event.preventDefault();
    setTimelineError("");
    const res = await fetch("/api/admin/timeline-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: Number(timelineForm.year),
        month: timelineForm.month ? Number(timelineForm.month) : null,
        day: timelineForm.day ? Number(timelineForm.day) : null,
        title: timelineForm.title,
        description: timelineForm.description,
        images: parseImageText(timelineForm.images),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTimelineError(data.error ?? "Could not add timeline event.");
      return;
    }
    const created = await res.json();
    setTimelineEvents((prev) => [...prev, created]);
    setTimelineForm({ year: "", month: "", day: "", title: "", description: "", images: "" });
  }

  async function toggleTimelineEventVisibility(entry) {
    const res = await fetch("/api/admin/timeline-events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: entry.id,
        year: entry.year,
        month: entry.month,
        day: entry.day,
        title: entry.title,
        description: entry.description,
        images: entry.images,
        visible: !entry.visible,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTimelineError(data.error ?? "Could not update timeline event.");
      return;
    }
    const updated = await res.json();
    setTimelineEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function removeTimelineEvent(id) {
    const res = await fetch(`/api/admin/timeline-events?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTimelineError(data.error ?? "Could not delete timeline event.");
      return;
    }
    setTimelineEvents((prev) => prev.filter((item) => item.id !== id));
  }

  async function patchMemory(id, patch) {
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
    setMemories((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }

  async function patchCondolence(id, patch) {
    const res = await fetch(`/api/admin/moderation/condolences/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setModerationError(data.error ?? "Could not update condolence.");
      return;
    }
    const updated = await res.json();
    setCondolences((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }

  if (!isAdmin) {
    return (
      <section className={styles.card}>
        <h1 className={styles.heading}>Admin login</h1>
        {!loginConfigured ? (
          <p className={styles.error}>Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET first.</p>
        ) : (
          <form className={styles.form} onSubmit={handleLogin}>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              aria-label="Admin password"
            />
            {loginError && <p className={styles.error}>{loginError}</p>}
            <button className={styles.button} type="submit">
              Log in
            </button>
          </form>
        )}
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>Admin dashboard</h1>
        <button className={styles.button} type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <nav className={styles.tabs}>
        {[
          { id: "settings", label: "Main page settings" },
          { id: "timeline", label: "Timeline events" },
          { id: "moderation", label: "Moderation" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.tab} ${tab === item.id ? styles.activeTab : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "settings" && (
        <div className={styles.panel}>
          <h2>Main-page images and title links</h2>
          <label className={styles.label}>Image URLs (one per line)</label>
          <textarea
            className={styles.textarea}
            rows={4}
            value={mainImagesText}
            onChange={(event) => setMainImagesText(event.target.value)}
          />
          {imageUploadEnabled && (
            <input
              className={styles.input}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setUploadedFiles(Array.from(event.target.files ?? []).slice(0, MAX_IMAGES))
              }
            />
          )}
          <h3>Title links</h3>
          {linkRows.map((row, index) => (
            <div key={`link-${index}`} className={styles.row}>
              <input
                className={styles.input}
                type="text"
                placeholder="Title"
                value={row.title}
                onChange={(event) => updateLinkRow(index, { title: event.target.value })}
              />
              <input
                className={styles.input}
                type="url"
                placeholder="https://example.com"
                value={row.url}
                onChange={(event) => updateLinkRow(index, { url: event.target.value })}
              />
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(event) => updateLinkRow(index, { active: event.target.checked })}
                />
                active
              </label>
            </div>
          ))}
          <button
            className={styles.button}
            type="button"
            onClick={() => setLinkRows((prev) => [...prev, { title: "", url: "", active: true }])}
          >
            Add link row
          </button>
          <p>Active links: {activeLinks.length}</p>
          {settingsError && <p className={styles.error}>{settingsError}</p>}
          <button className={styles.button} type="button" disabled={settingsSaving} onClick={saveSettings}>
            {settingsSaving ? "Saving..." : "Save settings"}
          </button>
        </div>
      )}

      {tab === "timeline" && (
        <div className={styles.panel}>
          <h2>Major timeline events</h2>
          <form className={styles.form} onSubmit={addTimelineEvent}>
            <div className={styles.row}>
              <input
                className={styles.input}
                type="number"
                placeholder="Year"
                value={timelineForm.year}
                onChange={(event) => setTimelineForm((prev) => ({ ...prev, year: event.target.value }))}
              />
              <input
                className={styles.input}
                type="number"
                placeholder="Month"
                value={timelineForm.month}
                onChange={(event) =>
                  setTimelineForm((prev) => ({ ...prev, month: event.target.value }))
                }
              />
              <input
                className={styles.input}
                type="number"
                placeholder="Day"
                value={timelineForm.day}
                onChange={(event) => setTimelineForm((prev) => ({ ...prev, day: event.target.value }))}
              />
            </div>
            <input
              className={styles.input}
              type="text"
              placeholder="Title"
              value={timelineForm.title}
              onChange={(event) => setTimelineForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Description"
              value={timelineForm.description}
              onChange={(event) =>
                setTimelineForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="Image URLs (one per line)"
              value={timelineForm.images}
              onChange={(event) => setTimelineForm((prev) => ({ ...prev, images: event.target.value }))}
            />
            {timelineError && <p className={styles.error}>{timelineError}</p>}
            <button className={styles.button} type="submit">
              Add event
            </button>
          </form>

          <ul className={styles.list}>
            {timelineEvents.map((entry) => (
              <li key={entry.id} className={styles.item}>
                <strong>
                  {entry.year}
                  {entry.month ? `-${String(entry.month).padStart(2, "0")}` : ""}
                  {entry.day ? `-${String(entry.day).padStart(2, "0")}` : ""} — {entry.title}
                </strong>
                {entry.description && <p>{entry.description}</p>}
                <div className={styles.actions}>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() => toggleTimelineEventVisibility(entry)}
                  >
                    {entry.visible ? "Hide" : "Show"}
                  </button>
                  <button className={styles.button} type="button" onClick={() => removeTimelineEvent(entry.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "moderation" && (
        <div className={styles.panel}>
          <h2>Moderate memories and condolences</h2>
          <p>
            <Link href="/memories">Open memories page</Link> ·{" "}
            <Link href="/condolences">Open condolences page</Link>
          </p>
          {moderationError && <p className={styles.error}>{moderationError}</p>}
          <h3>Memories</h3>
          <ul className={styles.list}>
            {memories.map((entry) => (
              <li key={entry.id} className={styles.item}>
                <strong>{entry.author}</strong> <p>{entry.memory}</p>
                <div className={styles.actions}>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() => patchMemory(entry.id, { visible: !entry.visible })}
                  >
                    {entry.visible ? "Hide" : "Show"}
                  </button>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() =>
                      patchMemory(entry.id, { showOnTimeline: !entry.showOnTimeline })
                    }
                  >
                    {entry.showOnTimeline ? "Remove from timeline" : "Show on timeline"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <h3>Condolences</h3>
          <ul className={styles.list}>
            {condolences.map((entry) => (
              <li key={entry.id} className={styles.item}>
                <strong>{entry.name}</strong> <p>{entry.message}</p>
                <div className={styles.actions}>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() => patchCondolence(entry.id, { visible: !entry.visible })}
                  >
                    {entry.visible ? "Hide" : "Show"}
                  </button>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() =>
                      patchCondolence(entry.id, { showOnTimeline: !entry.showOnTimeline })
                    }
                  >
                    {entry.showOnTimeline ? "Remove from timeline" : "Show on timeline"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
