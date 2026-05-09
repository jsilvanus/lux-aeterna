import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>In memoriam</h1>
        <Image
          src="/deceased-placeholder.svg"
          alt="Portrait of the deceased"
          width={320}
          height={420}
          priority
          className={styles.memorialImage}
        />
      </main>
    </div>
  );
}
