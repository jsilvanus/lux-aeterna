import Image from "next/image";
import profile from "@/content/memorialProfile";
import Candles from "@/app/components/Candles";
import Condolences from "@/app/components/Condolences";
import Memories from "@/app/components/Memories";
import Timeline from "@/app/components/Timeline";
import { getCandlesCount, listCondolences, listMemories } from "@/lib/db";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [count, condolences, memories] = await Promise.all([
    getCandlesCount(),
    listCondolences(),
    listMemories(),
  ]);

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
        <Timeline entries={profile.timeline} />
        <Candles initialCount={count} />
        <Condolences initialEntries={condolences} />
        <Memories initialEntries={memories} />
      </main>
    </div>
  );
}
