import { ensureAdminRequest } from "@/lib/adminApi";
import { setMemoryModeration } from "@/lib/db";

export async function PATCH(request, { params }) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = params;
  if (!id) {
    return Response.json({ error: "Memory id is required." }, { status: 400 });
  }

  const body = await request.json();
  const updated = await setMemoryModeration(id, {
    visible: body?.visible === undefined ? undefined : Boolean(body.visible),
    showOnTimeline: body?.showOnTimeline === undefined ? undefined : Boolean(body.showOnTimeline),
  });
  if (!updated) {
    return Response.json({ error: "Memory not found." }, { status: 404 });
  }
  return Response.json(updated);
}
