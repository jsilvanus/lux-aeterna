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

function normalizeImages(images, image) {
  if (Array.isArray(images)) {
    return images.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim());
  }

  if (typeof image === "string" && image.trim()) {
    return [image.trim()];
  }

  return [];
}

export default function Timeline({
  entries = [],
  memoryEntries = [],
  enableImages = false,
  variant = "compact",
}) {
  const mergedEntries = [
    ...entries.map((entry, index) => ({
      id: `timeline-${index}`,
      kind: "timeline",
      sortKey: Date.UTC(entry.year, (entry.month ?? 1) - 1, entry.day ?? 1),
      dateLabel: formatDate(entry),
      title: entry.title,
      description: entry.description,
      images: normalizeImages(entry.images, entry.image),
    })),
    ...memoryEntries.map((entry) => {
      const memoryDate = entry.memoryDate ?? entry.date?.slice(0, 10) ?? "";
      const hasMessage = typeof entry.message === "string" && entry.message.trim();
      const memoryText = typeof entry.memory === "string" ? entry.memory : "";
      return {
        id: `memory-${entry.id}`,
        kind: entry.kind === "condolence" ? "condolence" : "memory",
        sortKey: parseMemoryDate(memoryDate)?.getTime() ?? Number.MAX_SAFE_INTEGER,
        dateLabel: formatMemoryDate(memoryDate),
        title:
          entry.title ??
          (entry.kind === "condolence"
            ? `Condolence from ${entry.author ?? entry.name}`
            : `Memory from ${entry.author ?? entry.name}`),
        description: hasMessage ? entry.message : memoryText,
        images: normalizeImages(entry.images),
      };
    }),
  ].sort((a, b) => a.sortKey - b.sortKey);

  if (mergedEntries.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>🕰 Timeline</h2>
      <ul className={`${styles.list} ${variant === "snake" ? styles.snakeList : ""}`}>
        {mergedEntries.map((entry) => (
          <li
            key={entry.id}
            className={`${styles.item} ${entry.kind === "memory" ? styles.memoryItem : ""} ${variant === "snake" ? styles.snakeItem : ""}`}
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
            {enableImages && entry.images.length > 0 && (
              <div className={styles.images}>
                {entry.images.map((image, imageIndex) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${entry.id}-image-${imageIndex}`}
                    className={styles.image}
                    src={image}
                    alt={entry.title}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
