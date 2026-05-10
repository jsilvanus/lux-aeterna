import Link from "next/link";
import profile from "@/content/memorialProfile";
import Timeline from "@/app/components/Timeline";
import { listMemories } from "@/lib/db";
import { getPublicFeatureFlags } from "@/lib/featureFlags";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const memories = profile.showMemoriesOnTimeline ? await listMemories() : [];
  const featureFlags = getPublicFeatureFlags();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Life Timeline</h1>
        <p className={styles.subtitle}>Major events and shared memories in one flowing path.</p>
        <Timeline
          entries={profile.timeline}
          memoryEntries={memories}
          enableImages={featureFlags.imagesEnabled}
          variant="snake"
        />
        <Link className={styles.backLink} href="/">
          Back to memorial
        </Link>
      </main>
    </div>
  );
}
