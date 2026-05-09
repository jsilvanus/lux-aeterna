import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(process.cwd(), "data", "candles.json");

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

export async function POST() {
  const data = readData();
  data.count += 1;
  writeData(data);
  return Response.json(data);
}
