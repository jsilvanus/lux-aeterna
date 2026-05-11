import AdminPortal from "@/app/components/AdminPortal";
import { adminAuthConfigured, isAdminFromServerCookies } from "@/lib/adminAuth";
import {
  getSiteSettings,
  listCondolences,
  listMemories,
  listTimelineEvents,
} from "@/lib/db";
import { getPublicFeatureFlags } from "@/lib/featureFlags";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function KirjauduPage() {
  const [isAdmin, featureFlags] = await Promise.all([
    isAdminFromServerCookies(),
    Promise.resolve(getPublicFeatureFlags()),
  ]);

  const [settings, timelineEvents, memories, condolences] = isAdmin
    ? await Promise.all([
        getSiteSettings(),
        listTimelineEvents({ includeHidden: true }),
        listMemories({ includeHidden: true }),
        listCondolences({ includeHidden: true }),
      ])
    : [undefined, [], [], []];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <AdminPortal
          isAdmin={isAdmin}
          loginConfigured={adminAuthConfigured()}
          imageUploadEnabled={featureFlags.imageUploadEnabled}
          initialSettings={settings}
          initialTimelineEvents={timelineEvents}
          initialMemories={memories}
          initialCondolences={condolences}
        />
      </main>
    </div>
  );
}
