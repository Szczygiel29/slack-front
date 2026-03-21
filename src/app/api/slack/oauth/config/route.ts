import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      configured: Boolean(process.env.NEXT_PUBLIC_SLACK_CLIENT_ID),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
