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

export default function Timeline({ entries = [] }) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>🕰 Timeline</h2>
      <ul className={styles.list}>
        {entries.map((entry, index) => (
          <li
            key={`${entry.year}-${entry.month ?? ""}-${entry.day ?? ""}-${entry.title}-${index}`}
            className={styles.item}
          >
            <p className={styles.date}>{formatDate(entry)}</p>
            <h3 className={styles.title}>{entry.title}</h3>
            {entry.description && <p className={styles.description}>{entry.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
