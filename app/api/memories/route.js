import { addMemory, listMemories } from "@/lib/db";

const MAX_NAME = 80;
const MAX_MEMORY = 1000;

export async function GET() {
  const data = await listMemories();
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name ?? "").trim().slice(0, MAX_NAME);
  const memory = (body.memory ?? "").trim().slice(0, MAX_MEMORY);

  if (!name || !memory) {
    return Response.json({ error: "Name and memory are required." }, { status: 400 });
  }

  const entry = await addMemory(name, memory);
  return Response.json(entry, { status: 201 });
}
