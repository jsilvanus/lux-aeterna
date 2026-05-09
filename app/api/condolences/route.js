import { addCondolence, listCondolences } from "@/lib/db";

const MAX_NAME = 80;
const MAX_MESSAGE = 500;

export async function GET() {
  const data = await listCondolences();
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name ?? "").trim().slice(0, MAX_NAME);
  const message = (body.message ?? "").trim().slice(0, MAX_MESSAGE);

  if (!name || !message) {
    return Response.json({ error: "Name and message are required." }, { status: 400 });
  }

  const entry = await addCondolence(name, message);
  return Response.json(entry, { status: 201 });
}
