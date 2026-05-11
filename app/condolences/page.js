import Link from "next/link";
import Condolences from "@/app/components/Condolences";
import { isAdminFromServerCookies } from "@/lib/adminAuth";
import { listCondolences } from "@/lib/db";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function CondolencesPage() {
  const isAdmin = await isAdminFromServerCookies();
  const condolences = await listCondolences({ includeHidden: isAdmin });

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Condolences</h1>
        <Condolences initialEntries={condolences} isAdmin={isAdmin} />
        <Link className={styles.backLink} href="/">
          Back to memorial
        </Link>
      </main>
    </div>
  );
}
