import Image from "next/image";
import { memorialProfile } from "@/content/memorialProfile";
import styles from "./page.module.css";

export const dynamic = "force-static";

export default function Home() {
  const { title, name, birthDate, deathDate, tribute, image } = memorialProfile;

  return (
    <main className={styles.page}>
      <article className={styles.card} aria-label={`Memorial for ${name}`}>
        <header className={styles.header}>
          <p className={styles.kicker}>{title}</p>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.dates}>
            <span>{birthDate}</span>
            <span aria-hidden="true" className={styles.separator}>
              —
            </span>
            <span>{deathDate}</span>
          </p>
        </header>

        <figure className={styles.figure}>
          <Image
            src={image.src}
            alt={image.alt}
            width={600}
            height={600}
            className={styles.photo}
            priority
          />
        </figure>

        <p className={styles.tribute}>{tribute}</p>
      </article>
    </main>
  );
}
