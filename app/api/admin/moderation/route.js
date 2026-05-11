import { ensureAdminRequest } from "@/lib/adminApi";
import { listCondolences, listMemories } from "@/lib/db";

export async function GET(request) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const [memories, condolences] = await Promise.all([
    listMemories({ includeHidden: true }),
    listCondolences({ includeHidden: true }),
  ]);
  return Response.json({ memories, condolences });
}
