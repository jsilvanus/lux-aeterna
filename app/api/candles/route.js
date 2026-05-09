import { join } from "path";
import { readJSON, writeJSON, withFileLock } from "../fileStore";

const filePath = join(process.cwd(), "data", "candles.json");

export async function GET() {
  const data = readJSON(filePath);
  return Response.json(data);
}

export async function POST() {
  const data = await withFileLock(filePath, () => {
    const current = readJSON(filePath);
    current.count += 1;
    writeJSON(filePath, current);
    return current;
  });
  return Response.json(data);
}
