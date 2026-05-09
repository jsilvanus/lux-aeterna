import { join } from "path";
import { randomUUID } from "crypto";
import { readJSON, writeJSON, withFileLock } from "../fileStore";

const filePath = join(process.cwd(), "data", "memories.json");

const MAX_NAME = 80;
const MAX_MEMORY = 1000;

export async function GET() {
  const data = readJSON(filePath);
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name ?? "").trim().slice(0, MAX_NAME);
  const memory = (body.memory ?? "").trim().slice(0, MAX_MEMORY);

  if (!name || !memory) {
    return Response.json({ error: "Name and memory are required." }, { status: 400 });
  }

  const entry = await withFileLock(filePath, () => {
    const data = readJSON(filePath);
    const newEntry = { id: randomUUID(), name, memory, date: new Date().toISOString() };
    data.push(newEntry);
    writeJSON(filePath, data);
    return newEntry;
  });

  return Response.json(entry, { status: 201 });
}
