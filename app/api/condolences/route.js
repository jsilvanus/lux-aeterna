import { join } from "path";
import { randomUUID } from "crypto";
import { readJSON, writeJSON, withFileLock } from "../fileStore";

const filePath = join(process.cwd(), "data", "condolences.json");

const MAX_NAME = 80;
const MAX_MESSAGE = 500;

export async function GET() {
  const data = readJSON(filePath);
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name ?? "").trim().slice(0, MAX_NAME);
  const message = (body.message ?? "").trim().slice(0, MAX_MESSAGE);

  if (!name || !message) {
    return Response.json({ error: "Name and message are required." }, { status: 400 });
  }

  const entry = await withFileLock(filePath, () => {
    const data = readJSON(filePath);
    const newEntry = { id: randomUUID(), name, message, date: new Date().toISOString() };
    data.push(newEntry);
    writeJSON(filePath, data);
    return newEntry;
  });

  return Response.json(entry, { status: 201 });
}
