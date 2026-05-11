import { imageUploadEnabled } from "@/lib/featureFlags";
import { ensureAdminRequest } from "@/lib/adminApi";
import {
  addTimelineEvent,
  deleteTimelineEvent,
  listTimelineEvents,
  updateTimelineEvent,
} from "@/lib/db";
import { parseImageValues, validateImages } from "@/lib/imageValidation";

const MAX_TITLE = 160;
const MAX_DESCRIPTION = 1500;

function parseDateParts(body) {
  const year = Number(body?.year);
  const month = body?.month === null || body?.month === "" ? null : Number(body?.month);
  const day = body?.day === null || body?.day === "" ? null : Number(body?.day);
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return { error: "Year must be a valid number." };
  }
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
    return { error: "Month must be between 1 and 12." };
  }
  if (day !== null && (!Number.isInteger(day) || day < 1 || day > 31)) {
    return { error: "Day must be between 1 and 31." };
  }
  return { year, month, day, error: null };
}

function parsePayload(body) {
  const date = parseDateParts(body);
  if (date.error) {
    return { error: date.error };
  }

  const title = String(body?.title ?? "").trim().slice(0, MAX_TITLE);
  const description = String(body?.description ?? "").trim().slice(0, MAX_DESCRIPTION);
  if (!title) {
    return { error: "Title is required." };
  }

  const images = parseImageValues(body?.images);
  const imageValidation = validateImages(images, { allowDataUrls: imageUploadEnabled() });
  if (imageValidation.error) {
    return { error: imageValidation.error };
  }

  return {
    error: null,
    payload: {
      ...date,
      title,
      description: description || null,
      images,
      visible: body?.visible === undefined ? undefined : Boolean(body.visible),
    },
  };
}

export async function GET(request) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const data = await listTimelineEvents({ includeHidden: true });
  return Response.json(data);
}

export async function POST(request) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const parsed = parsePayload(body);
  if (parsed.error) {
    const status = parsed.error === "Image upload is disabled." ? 403 : 400;
    return Response.json({ error: parsed.error }, { status });
  }

  const entry = await addTimelineEvent(parsed.payload);
  return Response.json(entry, { status: 201 });
}

export async function PATCH(request) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json();
  const id = String(body?.id ?? "").trim();
  if (!id) {
    return Response.json({ error: "Event id is required." }, { status: 400 });
  }

  const parsed = parsePayload(body);
  if (parsed.error) {
    const status = parsed.error === "Image upload is disabled." ? 403 : 400;
    return Response.json({ error: parsed.error }, { status });
  }

  const updated = await updateTimelineEvent(id, parsed.payload);
  if (!updated) {
    return Response.json({ error: "Event not found." }, { status: 404 });
  }
  return Response.json(updated);
}

export async function DELETE(request) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return Response.json({ error: "Event id is required." }, { status: 400 });
  }
  const deleted = await deleteTimelineEvent(id);
  if (!deleted) {
    return Response.json({ error: "Event not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
