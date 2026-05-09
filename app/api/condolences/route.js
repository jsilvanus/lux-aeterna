import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(process.cwd(), "data", "condolences.json");

function readData() {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeData(data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readData();
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !message) {
    return Response.json({ error: "Name and message are required." }, { status: 400 });
  }

  const data = readData();
  const entry = { id: Date.now(), name, message, date: new Date().toISOString() };
  data.push(entry);
  writeData(data);

  return Response.json(entry, { status: 201 });
}
