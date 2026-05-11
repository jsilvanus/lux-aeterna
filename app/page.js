import Image from "next/image";
import Link from "next/link";
import profile from "@/content/memorialProfile";
import Candles from "@/app/components/Candles";
import Condolences from "@/app/components/Condolences";
import Memories from "@/app/components/Memories";
import Timeline from "@/app/components/Timeline";
import {
  getCandlesCount,
  getSiteSettings,
  listCondolences,
  listMemories,
  listTimelineEvents,
} from "@/lib/db";
import { getPublicFeatureFlags } from "@/lib/featureFlags";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [count, condolences, memories, settings, majorEvents] = await Promise.all([
    getCandlesCount(),
    listCondolences(),
    listMemories(),
    getSiteSettings(),
    listTimelineEvents(),
  ]);
  const featureFlags = getPublicFeatureFlags();
  const timelineEntries = majorEvents.length > 0 ? majorEvents : profile.timeline;
  const minorTimelineEntries = [
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
  const activeTitleLinks = (settings.titleLinks ?? []).filter((entry) => entry.active);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>In memoriam</h1>
        <Image
          src={profile.photo}
          alt={profile.photoAlt}
          width={320}
          height={420}
          priority
          className={styles.memorialImage}
        />
        <h2 className={styles.name}>{profile.name}</h2>
        <p className={styles.dates}>
          {profile.born} &ndash; {profile.passed}
        </p>
        {profile.message && (
          <p className={styles.message}>{profile.message}</p>
        )}
        {activeTitleLinks.length > 0 && (
          <ul className={styles.titleLinks}>
            {activeTitleLinks.map((entry, index) => (
              <li key={`main-link-${index}`}>
                <a href={entry.url} target="_blank" rel="noreferrer">
                  {entry.title}
                </a>
              </li>
            ))}
          </ul>
        )}
        {(settings.mainImages ?? []).length > 0 && (
          <div className={styles.mainImages}>
            {(settings.mainImages ?? []).map((image, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`main-image-${index}`}
                src={image}
                alt={`Memorial gallery ${index + 1}`}
                className={styles.mainImage}
                loading="lazy"
              />
            ))}
          </div>
        )}
        <Timeline
          entries={timelineEntries}
          memoryEntries={minorTimelineEntries}
          enableImages
        />
        <Link className={styles.timelineLink} href="/timeline">
          View full timeline
        </Link>
        <div className={styles.collectionLinks}>
          <Link className={styles.timelineLink} href="/memories">
            All memories
          </Link>
          <Link className={styles.timelineLink} href="/condolences">
            All condolences
          </Link>
        </div>
        <Candles initialCount={count} />
        <Condolences initialEntries={condolences} />
        <Memories
          initialEntries={memories}
          enableImages
          enableImageUpload={featureFlags.imageUploadEnabled}
        />
      </main>
    </div>
  );
}
