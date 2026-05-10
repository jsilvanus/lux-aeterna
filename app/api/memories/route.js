import { addMemory, listMemories } from "@/lib/db";
import { imageUploadEnabled, imagesEnabled } from "@/lib/featureFlags";

const MAX_AUTHOR = 80;
const MAX_MEMORY = 1000;
const MAX_IMAGES = 8;
const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_DATA_IMAGE_LENGTH = 8_000_000;

function isAllowedImageUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isAllowedDataImage(value) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(value);
}

function parseImages(rawImages) {
  if (!Array.isArray(rawImages)) {
    return [];
  }

  return rawImages
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES);
}

function sanitizeMemoryEntry(entry) {
  if (imagesEnabled()) {
    return entry;
  }

  return { ...entry, images: [] };
}

export async function GET() {
  const data = await listMemories();
  return Response.json(data.map((entry) => sanitizeMemoryEntry(entry)));
}

export async function POST(request) {
  const body = await request.json();
  const author = (body.author ?? body.name ?? "").trim().slice(0, MAX_AUTHOR);
  const memory = (body.memory ?? "").trim().slice(0, MAX_MEMORY);
  const memoryDate = (body.memoryDate ?? "").trim();
  const imageValues = parseImages(body.images);

  if (!author || !memory || !memoryDate) {
    return Response.json(
      { error: "Author, memory, and memory date are required." },
      { status: 400 },
    );
  }

  const parsed = new Date(`${memoryDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(memoryDate) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== memoryDate
  ) {
    return Response.json({ error: "Memory date must be a valid date." }, { status: 400 });
  }

  if (!imagesEnabled() && imageValues.length > 0) {
    return Response.json({ error: "Memory images are disabled." }, { status: 403 });
  }

  const dataUrlsUsed = imageValues.some((value) => value.startsWith("data:image/"));
  if (!imageUploadEnabled() && dataUrlsUsed) {
    return Response.json({ error: "Image upload is disabled." }, { status: 403 });
  }

  for (const value of imageValues) {
    if (value.startsWith("data:image/")) {
      if (value.length > MAX_DATA_IMAGE_LENGTH) {
        return Response.json({ error: "One or more uploaded images are too large." }, { status: 400 });
      }
      if (!isAllowedDataImage(value)) {
        return Response.json({ error: "Invalid uploaded image format." }, { status: 400 });
      }
      continue;
    }

    if (value.length > MAX_IMAGE_URL_LENGTH) {
      return Response.json({ error: "Image URL is too long." }, { status: 400 });
    }
    if (!isAllowedImageUrl(value)) {
      return Response.json({ error: "Only valid image URLs are allowed." }, { status: 400 });
    }
  }

  const entry = await addMemory(author, memory, memoryDate, imageValues);
  return Response.json(sanitizeMemoryEntry(entry), { status: 201 });
}
