import { getCandlesCount, lightCandle } from "@/lib/db";

export async function GET() {
  const count = await getCandlesCount();
  return Response.json({ count });
}

export async function POST() {
  const count = await lightCandle();
  return Response.json({ count });
}
