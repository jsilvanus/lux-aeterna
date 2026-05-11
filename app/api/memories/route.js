import { addMemory, listMemories } from "@/lib/db";
import { imageUploadEnabled } from "@/lib/featureFlags";
import { parseImageValues, validateImages } from "@/lib/imageValidation";

const MAX_AUTHOR = 80;
const MAX_MEMORY = 1000;

export async function GET() {
  const data = await listMemories();
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const author = (body.author ?? body.name ?? "").trim().slice(0, MAX_AUTHOR);
  const memory = (body.memory ?? "").trim().slice(0, MAX_MEMORY);
  const memoryDate = (body.memoryDate ?? "").trim();
  const imageValues = parseImageValues(body.images);

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

  const validation = validateImages(imageValues, { allowDataUrls: imageUploadEnabled() });
  if (validation.error) {
    const status = validation.error === "Image upload is disabled." ? 403 : 400;
    return Response.json({ error: validation.error }, { status });
  }

  const entry = await addMemory(author, memory, memoryDate, imageValues);
  return Response.json(entry, { status: 201 });
}
