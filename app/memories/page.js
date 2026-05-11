import Link from "next/link";
import Memories from "@/app/components/Memories";
import { isAdminFromServerCookies } from "@/lib/adminAuth";
import { listMemories } from "@/lib/db";
import { getPublicFeatureFlags } from "@/lib/featureFlags";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const [isAdmin, featureFlags] = await Promise.all([
    isAdminFromServerCookies(),
    Promise.resolve(getPublicFeatureFlags()),
  ]);
  const memories = await listMemories({ includeHidden: isAdmin });

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Memories</h1>
        <Memories
          initialEntries={memories}
          enableImages
          enableImageUpload={featureFlags.imageUploadEnabled}
          isAdmin={isAdmin}
        />
        <Link className={styles.backLink} href="/">
          Back to memorial
        </Link>
      </main>
    </div>
  );
}
