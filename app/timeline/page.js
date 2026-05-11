import Link from "next/link";
import profile from "@/content/memorialProfile";
import Timeline from "@/app/components/Timeline";
import { listCondolences, listMemories, listTimelineEvents } from "@/lib/db";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const [majorEvents, memories, condolences] = await Promise.all([
    listTimelineEvents(),
    listMemories(),
    listCondolences(),
  ]);
  const entries = majorEvents.length > 0 ? majorEvents : profile.timeline;
  const minorEntries = [
    ...memories.filter((entry) => entry.showOnTimeline),
    ...condolences
      .filter((entry) => entry.showOnTimeline)
      .map((entry) => ({
        id: `condolence-${entry.id}`,
        kind: "condolence",
        title: `Condolence from ${entry.name}`,
        author: entry.name,
        message: entry.message,
        memoryDate: entry.date?.slice(0, 10),
      })),
  ];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Life Timeline</h1>
        <p className={styles.subtitle}>Major events and shared memories in one flowing path.</p>
        <Timeline
          entries={entries}
          memoryEntries={minorEntries}
          enableImages
          variant="snake"
        />
        <Link className={styles.backLink} href="/">
          Back to memorial
        </Link>
      </main>
    </div>
  );
}
