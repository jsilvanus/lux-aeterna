import { readFileSync } from "fs";
import { join } from "path";
import Image from "next/image";
import profile from "@/content/memorialProfile";
import Candles from "@/app/components/Candles";
import Condolences from "@/app/components/Condolences";
import Memories from "@/app/components/Memories";
import styles from "./page.module.css";

function readData(filename) {
  const filePath = join(process.cwd(), "data", filename);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export default function Home() {
  const candles = readData("candles.json");
  const condolences = readData("condolences.json");
  const memories = readData("memories.json");

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
        <Candles initialCount={candles.count} />
        <Condolences initialEntries={condolences} />
        <Memories initialEntries={memories} />
      </main>
    </div>
  );
}
