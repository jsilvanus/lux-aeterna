import { ensureAdminRequest } from "@/lib/adminApi";
import { setCondolenceModeration } from "@/lib/db";

export async function PATCH(request, { params }) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Condolence id is required." }, { status: 400 });
  }

  const body = await request.json();
  const updated = await setCondolenceModeration(id, {
    visible: body?.visible === undefined ? undefined : Boolean(body.visible),
    showOnTimeline: body?.showOnTimeline === undefined ? undefined : Boolean(body.showOnTimeline),
  });
  if (!updated) {
    return Response.json({ error: "Condolence not found." }, { status: 404 });
  }
  return Response.json(updated);
}
