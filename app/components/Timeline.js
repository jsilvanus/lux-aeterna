import styles from "./Timeline.module.css";

function formatDate({ year, month, day }) {
  if (!month) {
    return String(year);
  }

  const safeDay = day ?? 1;
  const date = new Date(Date.UTC(year, month - 1, safeDay));

  if (day) {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function parseMemoryDate(value) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatMemoryDate(value) {
  const parsed = parseMemoryDate(value);
  if (!parsed) {
    return "";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function Timeline({ entries = [], memoryEntries = [] }) {
  const mergedEntries = [
    ...entries.map((entry, index) => ({
      id: `timeline-${index}`,
      kind: "timeline",
      sortKey: Date.UTC(entry.year, (entry.month ?? 1) - 1, entry.day ?? 1),
      dateLabel: formatDate(entry),
      title: entry.title,
      description: entry.description,
    })),
    ...memoryEntries.map((entry) => {
      const memoryDate = entry.memoryDate ?? entry.date?.slice(0, 10) ?? "";
      return {
        id: `memory-${entry.id}`,
        kind: "memory",
        sortKey: parseMemoryDate(memoryDate)?.getTime() ?? Number.MAX_SAFE_INTEGER,
        dateLabel: formatMemoryDate(memoryDate),
        title: `Memory from ${entry.author ?? entry.name}`,
        description: entry.memory,
      };
    }),
  ].sort((a, b) => a.sortKey - b.sortKey);

  if (mergedEntries.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>🕰 Timeline</h2>
      <ul className={styles.list}>
        {mergedEntries.map((entry) => (
          <li
            key={entry.id}
            className={`${styles.item} ${entry.kind === "memory" ? styles.memoryItem : ""}`}
          >
            {entry.dateLabel && <p className={styles.date}>{entry.dateLabel}</p>}
            <h3 className={`${styles.title} ${entry.kind === "memory" ? styles.memoryTitle : ""}`}>
              {entry.title}
            </h3>
            {entry.description && (
              <p
                className={`${styles.description} ${entry.kind === "memory" ? styles.memoryDescription : ""}`}
              >
                {entry.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
